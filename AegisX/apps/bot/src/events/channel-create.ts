import {
  AuditLogEvent,
  type GuildBasedChannel,
} from "discord.js";

import {
  antiNukeService,
} from "../security/antinuke/anti-nuke.service.js";

export async function handleChannelCreate(
  channel: GuildBasedChannel,
): Promise<void> {
  try {
    await antiNukeService.handle(
      channel.guild,
      {
        eventName: "channelCreate",
        action: AuditLogEvent.ChannelCreate,
        targetId: channel.id,
      },
    );
  } catch (error) {
    console.error(
      `❌ Anti-Nuke channel create handler failed in guild ${channel.guild.id}:`,
      error,
    );
  }
}