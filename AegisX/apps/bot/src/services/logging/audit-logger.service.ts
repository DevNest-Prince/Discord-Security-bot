import {
  type Guild,
  type EmbedBuilder,
  type TextChannel,
  type ActionRowBuilder,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";

export type LogCategory =
  | "all"
  | "moderation"
  | "security"
  | "jail"
  | "automod"
  | "members"
  | "messages"
  | "channels"
  | "roles"
  | "tickets"
  | "voice"
  | "config";

export async function dispatchLog(
  guild: Guild,
  category: LogCategory,
  embed: EmbedBuilder,
  components?: ActionRowBuilder<any>[],
): Promise<boolean> {
  try {
    const config = await getGuildConfig(guild.id);
    const logging = config.logging || { logEnabled: {}, logChannels: {} };

    // Check if category is enabled (default to true if channel mapped)
    if (logging.logEnabled && logging.logEnabled[category] === false) {
      return false;
    }

    // Resolve channel (Category specific -> Universal 'all' -> undefined)
    const channelId =
      logging.logChannels?.[category] ||
      logging.logChannels?.["all"] ||
      config.security?.antiNuke?.logChannelId;

    if (!channelId) return false;

    const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
    if (!channel || !channel.isTextBased()) return false;

    await channel.send({
      embeds: [embed],
      components: components || [],
    });

    return true;
  } catch (err) {
    console.error(`[AuditLogger] Failed to dispatch log for ${category} in ${guild.id}:`, err);
    return false;
  }
}
