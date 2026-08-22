import {
  AuditLogEvent,
  PermissionFlagsBits,
  type Role,
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

export async function handleRoleUpdate(
  oldRole: Role,
  newRole: Role,
): Promise<void> {
  // Check if dangerous permissions were newly added
  const hadDangerous = DANGEROUS_PERMISSIONS.some((p) => oldRole.permissions.has(p));
  const hasDangerousNow = DANGEROUS_PERMISSIONS.some((p) => newRole.permissions.has(p));

  const dangerousAdded = !hadDangerous && hasDangerousNow;

  try {
    await antiNukeService.handle(newRole.guild, {
      eventName: "roleUpdate",
      action: AuditLogEvent.RoleUpdate,
      targetId: newRole.id,
      actionType: "rlup",
      immediatePunish: dangerousAdded,
      onRecover: async () => {
        if (dangerousAdded) {
          await recoveryService.stripDangerousPermissions(
            newRole,
            "Anti-Nuke: Reverting unauthorized dangerous role permissions",
          );
        }
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke role update handler failed in guild ${newRole.guild.id}:`,
      error,
    );
  }
}
