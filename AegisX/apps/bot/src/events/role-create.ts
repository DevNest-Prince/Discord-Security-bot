import {
  AuditLogEvent,
  type Role,
} from "discord.js";
import { antiNukeService, recoveryService } from "../security/antinuke/index.js";

export async function handleRoleCreate(
  role: Role,
): Promise<void> {
  try {
    await antiNukeService.handle(role.guild, {
      eventName: "roleCreate",
      action: AuditLogEvent.RoleCreate,
      targetId: role.id,
      actionType: "rlcr",
      immediatePunish: true,
      onRecover: async () => {
        await recoveryService.deleteRogueRole(role, "Anti-Nuke: Removing unauthorized role");
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke role create handler failed in guild ${role.guild.id}:`,
      error,
    );
  }
}