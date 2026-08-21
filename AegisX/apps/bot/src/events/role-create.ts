import {
  AuditLogEvent,
  type Role,
} from "discord.js";

import {
  antiNukeService,
} from "../security/antinuke/anti-nuke.service.js";

export async function handleRoleCreate(
  role: Role,
): Promise<void> {
  try {
    await antiNukeService.handle(
      role.guild,
      {
        eventName: "roleCreate",
        action: AuditLogEvent.RoleCreate,
        targetId: role.id,
      },
    );
  } catch (error) {
    console.error(
      `❌ Anti-Nuke role create handler failed in guild ${role.guild.id}:`,
      error,
    );
  }
}