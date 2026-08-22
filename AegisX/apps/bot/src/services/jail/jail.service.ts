import {
  type Guild,
  type GuildMember,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  type Client,
} from "discord.js";
import {
  getGuildConfig,
  updateGuildConfig,
  createJailSession,
  getActiveJailSession,
  getExpiredJailSessions,
  closeJailSession,
  type JailSession,
} from "@aegisx/database";
import { caseService } from "../moderation/case.service.js";
import { dispatchLog } from "../logging/audit-logger.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export class JailService {
  /**
   * Automatically provisions Jail Role, Category, and Channel if not already configured.
   */
  async setupJail(guild: Guild): Promise<{
    roleId: string;
    categoryId: string;
    channelId: string;
  }> {
    // 1. Create or Find Jail Role
    let jailRole = guild.roles.cache.find((r) => r.name.toLowerCase() === "jailed");
    if (!jailRole) {
      jailRole = await guild.roles.create({
        name: "Jailed",
        color: 0x2b2d31,
        permissions: [],
        reason: "AegisX Jail Quarantine Role setup",
      });
    }

    // 2. Create or Find Jail Category
    let jailCategory = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === "quarantine-jail",
    );
    if (!jailCategory) {
      jailCategory = await guild.channels.create({
        name: "QUARANTINE-JAIL",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id, // @everyone
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: jailRole.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });
    }

    // 3. Create or Find Jail Text Channel
    let jailChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name.toLowerCase() === "jail-cell",
    );
    if (!jailChannel) {
      jailChannel = await guild.channels.create({
        name: "jail-cell",
        type: ChannelType.GuildText,
        parent: jailCategory.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: jailRole.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });
    }

    // 4. Overwrite permissions on other channels to deny view/send for jail role
    guild.channels.cache.forEach(async (chan) => {
      if (chan.id !== jailChannel!.id && chan.id !== jailCategory!.id && !chan.isThread()) {
        await chan.permissionOverwrites
          .edit(jailRole!.id, {
            ViewChannel: false,
            SendMessages: false,
            Connect: false,
          })
          .catch(() => {});
      }
    });

    const config = await getGuildConfig(guild.id);
    await updateGuildConfig(guild.id, {
      ...config,
      jail: {
        ...(config.jail || {}),
        enabled: true,
        jailRoleId: jailRole.id,
        jailCategoryId: jailCategory.id,
        jailChannelId: jailChannel.id,
        autoRoleRestore: true,
        rejoinProtection: true,
      },
    });

    return {
      roleId: jailRole.id,
      categoryId: jailCategory.id,
      channelId: jailChannel.id,
    };
  }

  /**
   * Jails a member, snapshots their roles, strips them, and applies quarantine restrictions.
   */
  async jailMember(
    guild: Guild,
    member: GuildMember,
    moderator: { id: string; tag: string },
    reason: string,
    durationSeconds?: number | null,
  ): Promise<{ success: boolean; caseId: number; error?: string }> {
    const config = await getGuildConfig(guild.id);
    let jailRoleId = config.jail?.jailRoleId;

    if (!jailRoleId || !guild.roles.cache.has(jailRoleId)) {
      const setup = await this.setupJail(guild);
      jailRoleId = setup.roleId;
    }

    // 1. Snapshot member's roles
    const savedRoleIds = member.roles.cache
      .filter((r) => r.id !== guild.id && !r.managed && r.id !== jailRoleId)
      .map((r) => r.id);

    // 2. Create Moderation Case
    const modCase = await caseService.recordCase(guild.id, {
      targetId: member.id,
      targetTag: member.user.tag,
      moderatorId: moderator.id,
      moderatorTag: moderator.tag,
      action: "jail",
      reason,
      durationSeconds,
      source: "command",
    });

    // 3. Strip existing roles & assign jail role
    try {
      if (savedRoleIds.length > 0) {
        await member.roles.remove(savedRoleIds, "Jail quarantine isolation");
      }
      await member.roles.add(jailRoleId, "Jail quarantine role assigned");
    } catch (err: any) {
      return { success: false, caseId: modCase.caseId, error: err?.message };
    }

    // 4. Save Jail Session to Database
    const expiresAt =
      durationSeconds && durationSeconds > 0
        ? new Date(Date.now() + durationSeconds * 1000)
        : null;

    await createJailSession({
      guildId: guild.id,
      userId: member.id,
      moderatorId: moderator.id,
      reason,
      savedRoleIds,
      jailRoleId,
      durationSeconds,
      expiresAt,
      active: true,
      caseId: modCase.caseId,
    });

    // 5. Send Jail DM
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(AegisColors.Danger)
        .setTitle(`🚨 You have been quarantined / jailed in ${guild.name}`)
        .setDescription(
          `**Reason:** ${reason}\n` +
          (expiresAt ? `**Duration:** Expires <t:${Math.floor(expiresAt.getTime() / 1000)}:R>\n` : `**Duration:** Permanent\n`) +
          `You have been restricted to the quarantine channel until released by server staff.`,
        )
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch {}

    // 6. Dispatch Audit Log
    const logEmbed = new EmbedBuilder()
      .setColor(AegisColors.Danger)
      .setTitle("🚨 Member Quarantined / Jailed")
      .setDescription(
        `**User:** <@${member.id}> (\`${member.user.tag}\`)\n` +
        `**Moderator:** <@${moderator.id}>\n` +
        `**Case ID:** \`#${modCase.caseId}\`\n` +
        `**Reason:** ${reason}\n` +
        `**Roles Isolated:** ${savedRoleIds.length}\n` +
        (expiresAt ? `**Expires:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : `**Duration:** Permanent`),
      )
      .setTimestamp();
    await dispatchLog(guild, "jail", logEmbed);

    return { success: true, caseId: modCase.caseId };
  }

  /**
   * Releases a user from jail and restores their original roles.
   */
  async unjailMember(
    guild: Guild,
    userId: string,
    unjailedBy: { id: string; tag: string },
    reason = "Manual release from jail",
  ): Promise<{ success: boolean; restoredRolesCount: number; error?: string }> {
    const session = await getActiveJailSession(guild.id, userId);
    if (!session) {
      return { success: false, restoredRolesCount: 0, error: "Member does not have an active jail session." };
    }

    const member = await guild.members.fetch(userId).catch(() => null);

    // 1. Remove Jail Role & Restore Saved Roles
    let restoredCount = 0;
    if (member) {
      try {
        if (member.roles.cache.has(session.jailRoleId)) {
          await member.roles.remove(session.jailRoleId, "Unjailed");
        }
        if (session.savedRoleIds && session.savedRoleIds.length > 0) {
          const validRoleIds = session.savedRoleIds.filter((rId) => guild.roles.cache.has(rId));
          await member.roles.add(validRoleIds, "Restoring roles upon unjail");
          restoredCount = validRoleIds.length;
        }
      } catch (err: any) {
        console.error(`[JailService] Failed to restore roles for ${userId}:`, err);
      }
    }

    // 2. Close Session in DB
    await closeJailSession(guild.id, userId, unjailedBy.id, reason);

    // 3. Create Case
    const modCase = await caseService.recordCase(guild.id, {
      targetId: userId,
      targetTag: member ? member.user.tag : userId,
      moderatorId: unjailedBy.id,
      moderatorTag: unjailedBy.tag,
      action: "unjail",
      reason,
      source: "command",
    });

    // 4. Dispatch Audit Log
    const logEmbed = new EmbedBuilder()
      .setColor(AegisColors.Success)
      .setTitle("🔓 Member Released from Jail / Unjailed")
      .setDescription(
        `**User:** <@${userId}>\n` +
        `**Released By:** <@${unjailedBy.id}>\n` +
        `**Case ID:** \`#${modCase.caseId}\`\n` +
        `**Reason:** ${reason}\n` +
        `**Roles Restored:** ${restoredCount}`,
      )
      .setTimestamp();
    await dispatchLog(guild, "jail", logEmbed);

    return { success: true, restoredRolesCount: restoredCount };
  }

  /**
   * Re-enforces jail status if a quarantined user rejoins the server.
   */
  async handleRejoinJail(member: GuildMember): Promise<void> {
    const session = await getActiveJailSession(member.guild.id, member.id);
    if (!session) return;

    try {
      const allRoles = member.roles.cache
        .filter((r) => r.id !== member.guild.id && !r.managed && r.id !== session.jailRoleId)
        .map((r) => r.id);

      if (allRoles.length > 0) {
        await member.roles.remove(allRoles, "Re-enforcing jail quarantine on rejoin");
      }
      await member.roles.add(session.jailRoleId, "Re-enforcing jail role on rejoin");
    } catch (err) {
      console.error(`[JailService] Failed to re-enforce jail on rejoin for ${member.id}:`, err);
    }
  }

  /**
   * Background task: checks and unjails users whose temporary jail has expired.
   */
  async processExpiredJails(client: Client): Promise<void> {
    const expiredSessions = await getExpiredJailSessions();
    for (const session of expiredSessions) {
      const guild = client.guilds.cache.get(session.guildId);
      if (!guild) continue;

      await this.unjailMember(
        guild,
        session.userId,
        { id: client.user!.id, tag: "AegisX Jail Timer" },
        "Temporary jail duration expired",
      ).catch(() => {});
    }
  }
}

export const jailService = new JailService();
