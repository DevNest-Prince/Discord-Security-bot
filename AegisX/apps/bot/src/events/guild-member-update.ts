import {
  AuditLogEvent,
  PermissionFlagsBits,
  type GuildMember,
  type PartialGuildMember,
} from "discord.js";
import { antiNukeService, recoveryService } from "../security/antinuke/index.js";

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
  // Find newly added roles
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
