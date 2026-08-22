import {
  AuditLogEvent,
  PermissionFlagsBits,
  EmbedBuilder,
  type GuildMember,
  type PartialGuildMember,
} from "discord.js";
import { antiNukeService, recoveryService } from "../security/antinuke/index.js";
import { getActiveJailSession } from "@aegisx/database";
import { dispatchLog } from "../services/logging/audit-logger.service.js";
import { AegisColors } from "../utils/ui/colors.js";

const DANGEROUS_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.MentionEveryone,
];

export async function handleGuildMemberUpdate(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember,
): Promise<void> {
  const guild = newMember.guild;

  // 1. Jail Role Bypass Guardian
  try {
    const activeJail = await getActiveJailSession(guild.id, newMember.id);
    if (activeJail) {
      const jailRoleId = activeJail.jailRoleId;
      // If jail role was removed
      if (oldMember.roles.cache.has(jailRoleId) && !newMember.roles.cache.has(jailRoleId)) {
        await newMember.roles.add(jailRoleId, "Anti-Bypass: Restoring jail quarantine role");
        const alertEmbed = new EmbedBuilder()
          .setColor(AegisColors.Danger)
          .setTitle("⚠️ Jail Bypass Attempt Detected")
          .setDescription(
            `**Target:** <@${newMember.id}>\n` +
            `**Action:** Jail role was removed externally. AegisX re-enforced quarantine isolation.`,
          )
          .setTimestamp();
        await dispatchLog(guild, "jail", alertEmbed);
      }
    }
  } catch (err) {
    console.error(`[MemberUpdate] Jail bypass check error in ${guild.id}:`, err);
  }

  // 2. Member Role Changes Audit Logging
  try {
    const addedRoles = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));

    if (addedRoles.size > 0 || removedRoles.size > 0) {
      const desc = [];
      if (addedRoles.size > 0) desc.push(`**Added:** ${addedRoles.map((r) => `<@&${r.id}>`).join(", ")}`);
      if (removedRoles.size > 0) desc.push(`**Removed:** ${removedRoles.map((r) => `<@&${r.id}>`).join(", ")}`);

      const logEmbed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("👤 Member Roles Updated")
        .setDescription(`**User:** <@${newMember.id}> (\`${newMember.user.tag}\`)\n${desc.join("\n")}`)
        .setTimestamp();

      await dispatchLog(guild, "members", logEmbed);
    }
  } catch {}

  // 3. Anti-Nuke Dangerous Permission Escalation
  const addedRoles = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id));
  if (addedRoles.size === 0) return;

  const dangerousAddedRole = addedRoles.find((role) =>
    DANGEROUS_PERMISSIONS.some((perm) => role.permissions.has(perm)),
  );

  if (!dangerousAddedRole) return;

  try {
    await antiNukeService.handle(newMember.guild, {
      eventName: "memberRoleUpdate",
      action: AuditLogEvent.MemberRoleUpdate,
      targetId: newMember.id,
      actionType: "memup",
      immediatePunish: true,
      onRecover: async () => {
        await recoveryService.removeDangerousRoleFromMember(
          newMember,
          dangerousAddedRole,
          "Anti-Nuke: Stripping unauthorized dangerous role",
        );
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke member role update handler failed in guild ${newMember.guild.id}:`,
      error,
    );
  }
}
