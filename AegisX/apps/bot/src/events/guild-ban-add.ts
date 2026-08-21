import type { Guild } from "discord.js";

import { AuditLogEvent } from "discord.js";

import {
  antiNukeService,
} from "../security/antinuke/anti-nuke.service.js";

export async function handleGuildBanAdd(
  guild: Guild,
  userId: string,
): Promise<void> {
  try {
    await antiNukeService.handle(
      guild,
      {
        eventName: "guildBanAdd",
        action: AuditLogEvent.MemberBanAdd,
        targetId: userId,
      },
    );
  } catch (error) {
    console.error(
      `❌ Anti-Nuke ban handler failed in guild ${guild.id}:`,
      error,
    );
  }
}