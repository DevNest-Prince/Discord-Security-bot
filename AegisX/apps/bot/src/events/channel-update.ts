import {
  AuditLogEvent,
  type DMChannel,
  type NonThreadGuildBasedChannel,
  type GuildChannel,
} from "discord.js";
import { antiNukeService } from "../security/antinuke/index.js";

export async function handleChannelUpdate(
  oldChannel: DMChannel | NonThreadGuildBasedChannel,
  newChannel: DMChannel | NonThreadGuildBasedChannel,
): Promise<void> {
  if (oldChannel.isDMBased() || newChannel.isDMBased()) return;

  const oldGuildChannel = oldChannel as GuildChannel;
  const newGuildChannel = newChannel as GuildChannel;

  try {
    await antiNukeService.handle(newGuildChannel.guild, {
      eventName: "channelUpdate",
      action: AuditLogEvent.ChannelUpdate,
      targetId: newGuildChannel.id,
      actionType: "chup",
      immediatePunish: true,
      onRecover: async () => {
        // Revert channel name and topic
        if (oldGuildChannel.name !== newGuildChannel.name && newGuildChannel.isTextBased()) {
          await newGuildChannel.setName(oldGuildChannel.name, "Anti-Nuke: Reverting channel name");
        }
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke channel update handler failed in guild ${newGuildChannel.guild.id}:`,
      error,
    );
  }
}
