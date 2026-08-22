import {
  AuditLogEvent,
  type GuildBasedChannel,
  type GuildChannel,
} from "discord.js";
import { antiNukeService, recoveryService } from "../security/antinuke/index.js";

export async function handleChannelDelete(
  channel: GuildBasedChannel,
): Promise<void> {
  const guildChannel = channel as GuildChannel;
  const snapshot = {
    name: guildChannel.name,
    type: guildChannel.type,
    topic: "topic" in guildChannel ? (guildChannel.topic as string) : null,
    parentId: guildChannel.parentId,
    position: guildChannel.rawPosition,
    permissionOverwrites: guildChannel.permissionOverwrites?.cache.map((ow) => ({
      id: ow.id,
      type: ow.type,
      allow: ow.allow.bitfield,
      deny: ow.deny.bitfield,
    })),
  };

  try {
    await antiNukeService.handle(channel.guild, {
      eventName: "channelDelete",
      action: AuditLogEvent.ChannelDelete,
      targetId: channel.id,
      actionType: "chdl",
      immediatePunish: true,
      onRecover: async () => {
        await recoveryService.recreateDeletedChannel(channel.guild, snapshot, "Anti-Nuke: Restoring deleted channel");
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke channel delete handler failed in guild ${channel.guild.id}:`,
      error,
    );
  }
}