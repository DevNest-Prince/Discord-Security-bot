import {
  type Guild,
  type TextChannel,
  EmbedBuilder,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export async function dispatchLog(
  guild: Guild,
  eventType: string,
  embed: EmbedBuilder,
): Promise<void> {
  const config = await getGuildConfig(guild.id);
  const logging = config.logging;
  if (!logging) return;

  const isEnabled = logging.logEnabled?.[eventType] ?? true;
  if (!isEnabled) return;

  const targetChannelId = logging.logChannels?.[eventType] || logging.logChannels?.["all"];
  if (!targetChannelId) return;

  const channel = guild.channels.cache.get(targetChannelId) as TextChannel | undefined;
  if (channel && channel.isTextBased()) {
    embed.setFooter({ text: `AegisX Audit Log • Event: ${eventType}` });
    embed.setTimestamp();
    await channel.send({ embeds: [embed] }).catch(() => {});
  }
}
