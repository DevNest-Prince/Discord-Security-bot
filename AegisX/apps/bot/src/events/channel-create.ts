import {
  AuditLogEvent,
  type GuildBasedChannel,
  type GuildChannel,
} from "discord.js";
import { antiNukeService, recoveryService } from "../security/antinuke/index.js";

export async function handleChannelCreate(
  channel: GuildBasedChannel,
): Promise<void> {
  try {
    await antiNukeService.handle(channel.guild, {
      eventName: "channelCreate",
      action: AuditLogEvent.ChannelCreate,
      targetId: channel.id,
      actionType: "chcr",
      immediatePunish: true,
      onRecover: async () => {
        await recoveryService.deleteRogueChannel(channel as GuildChannel, "Anti-Nuke: Removing unauthorized channel");
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke channel create handler failed in guild ${channel.guild.id}:`,
      error,
    );
  }
}