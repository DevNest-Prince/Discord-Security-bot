import {
  type Presence,
  type GuildMember,
  EmbedBuilder,
  type TextChannel,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export async function handlePresenceUpdate(
  oldPresence: Presence | null,
  newPresence: Presence,
): Promise<void> {
  if (!newPresence.guild || !newPresence.member) return;

  const guild = newPresence.guild;
  const member = newPresence.member;
  if (member.user.bot) return;

  const config = await getGuildConfig(guild.id);
  const vanitySetups = config.vanityRoles || [];
  if (vanitySetups.length === 0) return;

  const activities = newPresence.activities || [];
  const customStatus = activities.find((a) => a.type === 4)?.state || "";

  for (const setup of vanitySetups) {
    if (!setup.vanity || !setup.roleId) continue;

    const role = guild.roles.cache.get(setup.roleId);
    if (!role) continue;

    const hasVanityInStatus = customStatus.toLowerCase().includes(setup.vanity.toLowerCase());
    const hasRole = member.roles.cache.has(role.id);

    if (hasVanityInStatus && !hasRole) {
      try {
        await member.roles.add(role, `AegisX Vanity Role: '${setup.vanity}' detected in custom status`);
        if (setup.logChannelId) {
          const logChan = guild.channels.cache.get(setup.logChannelId) as TextChannel | undefined;
          if (logChan && logChan.isTextBased()) {
            const embed = new EmbedBuilder()
              .setColor(AegisColors.Success)
              .setTitle("✨ Vanity Role Granted")
              .setDescription(`**Member:** <@${member.id}> (${member.user.tag})\n**Status:** \`${customStatus}\`\n**Role:** <@&${role.id}>`)
              .setTimestamp();
            await logChan.send({ embeds: [embed] }).catch(() => {});
          }
        }
      } catch (err) {
        console.error(`[Vanity] Failed to add role ${role.id} in ${guild.id}:`, err);
      }
    } else if (!hasVanityInStatus && hasRole) {
      try {
        await member.roles.remove(role, `AegisX Vanity Role: '${setup.vanity}' removed from custom status`);
        if (setup.logChannelId) {
          const logChan = guild.channels.cache.get(setup.logChannelId) as TextChannel | undefined;
          if (logChan && logChan.isTextBased()) {
            const embed = new EmbedBuilder()
              .setColor(AegisColors.Warning)
              .setTitle("⚠️ Vanity Role Revoked")
              .setDescription(`**Member:** <@${member.id}> (${member.user.tag})\n**Reason:** Removed vanity keyword \`${setup.vanity}\` from custom status\n**Role:** <@&${role.id}>`)
              .setTimestamp();
            await logChan.send({ embeds: [embed] }).catch(() => {});
          }
        }
      } catch (err) {
        console.error(`[Vanity] Failed to remove role ${role.id} in ${guild.id}:`, err);
      }
    }
  }
}
