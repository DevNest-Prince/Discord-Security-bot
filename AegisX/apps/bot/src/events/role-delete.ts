import {
  AuditLogEvent,
  type Role,
} from "discord.js";
import { antiNukeService, recoveryService } from "../security/antinuke/index.js";

export async function handleRoleDelete(
  role: Role,
): Promise<void> {
  const snapshot = {
    name: role.name,
    color: role.color,
    hoist: role.hoist,
    position: role.position,
    permissions: role.permissions.bitfield,
    mentionable: role.mentionable,
  };

  try {
    await antiNukeService.handle(role.guild, {
      eventName: "roleDelete",
      action: AuditLogEvent.RoleDelete,
      targetId: role.id,
      actionType: "rldl",
      immediatePunish: true,
      onRecover: async () => {
        await recoveryService.recreateDeletedRole(role.guild, snapshot, "Anti-Nuke: Restoring deleted role");
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke role delete handler failed in guild ${role.guild.id}:`,
      error,
    );
  }
}