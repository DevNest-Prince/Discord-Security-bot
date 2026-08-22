import {
  AuditLogEvent,
  type Guild,
} from "discord.js";
import { antiNukeService } from "../security/antinuke/index.js";

export async function handleGuildBanRemove(
  guild: Guild,
  userId: string,
): Promise<void> {
  try {
    await antiNukeService.handle(guild, {
      eventName: "guildBanRemove",
      action: AuditLogEvent.MemberBanRemove,
      targetId: userId,
      actionType: "ban",
      immediatePunish: false,
      onRecover: async () => {
        // Re-ban the target user
        await guild.bans.create(userId, { reason: "Anti-Nuke: Reverting unauthorized unban" });
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke ban remove handler failed in guild ${guild.id}:`,
      error,
    );
  }
}
