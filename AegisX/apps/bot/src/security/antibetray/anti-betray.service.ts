import {
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { emergencyService } from "../emergency/emergency.service.js";

const DANGEROUS_PERMS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageWebhooks,
];

export class AntiBetrayService {
  private readonly userSuspiciousCount = new Map<string, number>();

  /**
   * Records a suspicious action from an admin or extra-owner and checks if betrayal threshold is exceeded.
   */
  async recordSuspiciousAction(
    guild: Guild,
    executorMember: GuildMember,
    actionName: string,
  ): Promise<boolean> {
    // Cannot act against primary server owner
    if (executorMember.id === guild.ownerId) return false;

    const config = await getGuildConfig(guild.id);
    const antiBetray = config.antiBetray;

    if (!antiBetray || !antiBetray.enabled) return false;

    const key = `${guild.id}:${executorMember.id}`;
    const count = (this.userSuspiciousCount.get(key) ?? 0) + 1;
    this.userSuspiciousCount.set(key, count);

    const maxActions = antiBetray.maxSuspiciousActions || 3;

    if (count >= maxActions) {
      this.userSuspiciousCount.delete(key);
      await this.handleBetrayal(guild, executorMember, actionName, count);
      return true;
    }

    return false;
  }

  private async handleBetrayal(
    guild: Guild,
    member: GuildMember,
    reason: string,
    actionCount: number,
  ): Promise<void> {
    console.warn(`🚨 [Anti-Betray] Rogue action detected from ${member.user.tag} (${member.id}) in ${guild.name}`);

    // 1. Strip all dangerous/administrative roles from the member
    try {
      const dangerousRoles = member.roles.cache.filter((role) =>
        role.editable &&
        !role.managed &&
        role.id !== guild.id &&
        DANGEROUS_PERMS.some((perm) => role.permissions.has(perm)),
      );

      if (dangerousRoles.size > 0) {
        await member.roles.remove(dangerousRoles, "Anti-Betray: Stripping admin roles from rogue user");
      }
    } catch (roleErr) {
      console.error("⚠️ Failed to strip roles from rogue user:", roleErr);
    }

    // 2. Trigger auto emergency lockdown to freeze the server
    await emergencyService.lockdown(
      guild,
      `Anti-Betray Auto-Lockdown: Triggered by ${member.user.tag} (${reason})`,
    );

    // 3. DM Primary Server Owner
    try {
      const owner = await guild.fetchOwner();
      if (owner) {
        const dmEmbed = new EmbedBuilder()
          .setTitle("🚨 CRITICAL ALERT: Anti-Betray Triggered")
          .setColor(0xff0000)
          .setDescription(
            `**AegisX has detected potential betrayal / rogue behavior in your server:** **${guild.name}**\n\n` +
            `• **Rogue Staff**: <@${member.id}> (\`${member.user.tag}\` | \`${member.id}\`)\n` +
            `• **Actions Count**: ${actionCount} unauthorized critical actions\n` +
            `• **Action Taken**: Stripped administrative roles & activated server-wide **Emergency Lockdown** to protect your server.`,
          )
          .setTimestamp();

        await owner.send({ embeds: [dmEmbed] }).catch(() => null);
      }
    } catch {
      // Ignore DM failure if DMs closed
    }

    // 4. Send rich embed to log channel
    const config = await getGuildConfig(guild.id);
    const logChannelId = config.antiBetray?.logChannelId || config.security?.antiNuke?.logChannelId;

    if (logChannelId) {
      try {
        const logChannel = (await guild.channels.fetch(logChannelId).catch(() => null)) as TextChannel | null;
        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setTitle("🚨 Anti-Betray Security Incident")
            .setColor(0xff0000)
            .addFields(
              { name: "Staff Member", value: `<@${member.id}> (\`${member.id}\`)`, inline: true },
              { name: "Trigger", value: `Exceeded ${actionCount} critical security actions`, inline: true },
              { name: "Server Defense", value: "Locked all channels & stripped dangerous roles", inline: false },
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (logErr) {
        console.error("⚠️ Failed to send Anti-Betray log embed:", logErr);
      }
    }
  }
}

export const antiBetrayService = new AntiBetrayService();
