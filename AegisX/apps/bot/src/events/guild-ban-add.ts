import type { Guild } from "discord.js";
import { AuditLogEvent } from "discord.js";
import { antiNukeService, recoveryService } from "../security/antinuke/index.js";

export async function handleGuildBanAdd(
  guild: Guild,
  userId: string,
): Promise<void> {
  try {
    await antiNukeService.handle(guild, {
      eventName: "guildBanAdd",
      action: AuditLogEvent.MemberBanAdd,
      targetId: userId,
      actionType: "ban",
      immediatePunish: true,
      onRecover: async () => {
        await recoveryService.revertBan(guild, userId, "Anti-Nuke: Reverting unauthorized ban");
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke ban handler failed in guild ${guild.id}:`,
      error,
    );
  }
}