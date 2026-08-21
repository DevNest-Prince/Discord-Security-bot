import {
  AuditLogEvent,
  type Role,
} from "discord.js";

import {
  antiNukeService,
} from "../security/antinuke/anti-nuke.service.js";

export async function handleRoleDelete(
  role: Role,
): Promise<void> {
  try {
    await antiNukeService.handle(
      role.guild,
      {
        eventName: "roleDelete",
        action: AuditLogEvent.RoleDelete,
        targetId: role.id,
      },
    );
  } catch (error) {
    console.error(
      `❌ Anti-Nuke role delete handler failed in guild ${role.guild.id}:`,
      error,
    );
  }
}