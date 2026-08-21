import {
  AuditLogEvent,
  type GuildBasedChannel,
} from "discord.js";

import {
  antiNukeService,
} from "../security/antinuke/anti-nuke.service.js";

export async function handleChannelDelete(
  channel: GuildBasedChannel,
): Promise<void> {
  try {
    await antiNukeService.handle(
      channel.guild,
      {
        eventName: "channelDelete",
        action: AuditLogEvent.ChannelDelete,
        targetId: channel.id,
      },
    );
  } catch (error) {
    console.error(
      `❌ Anti-Nuke channel delete handler failed in guild ${channel.guild.id}:`,
      error,
    );
  }
}