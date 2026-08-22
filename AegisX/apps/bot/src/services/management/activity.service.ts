import {
  recordMessageActivity,
  recordVoiceActivity,
  getLeaderboard,
  getUserActivity,
  resetLeaderboardInterval,
  type ActivityLeaderboard,
} from "@aegisx/database";
import { EmbedBuilder, type Message } from "discord.js";
import { AegisColors } from "../../utils/ui/colors.js";

// In-memory voice connection start timestamps
const voiceJoinTimes = new Map<string, number>();

export class ActivityService {
  async handleMessage(message: Message): Promise<void> {
    if (!message.guild || message.author.bot) return;
    if (message.content.length < 3) return; // Prevent 1-char spam count

    await recordMessageActivity(message.guild.id, message.author.id);
  }

  async handleVoiceJoin(guildId: string, userId: string): Promise<void> {
    voiceJoinTimes.set(`${guildId}:${userId}`, Date.now());
  }

  async handleVoiceLeave(guildId: string, userId: string): Promise<void> {
    const key = `${guildId}:${userId}`;
    const joinTime = voiceJoinTimes.get(key);
    if (!joinTime) return;

    const seconds = Math.floor((Date.now() - joinTime) / 1000);
    voiceJoinTimes.delete(key);

    if (seconds > 10) {
      await recordVoiceActivity(guildId, userId, seconds);
    }
  }

  async buildLeaderboardEmbed(
    guildId: string,
    guildName: string,
    type: "messages" | "voice",
    interval: "daily" | "weekly" | "monthly" | "total" = "weekly",
  ): Promise<EmbedBuilder> {
    const entries = await getLeaderboard(guildId, type, interval, 10);
    const titleType = type === "messages" ? "💬 Message Leaderboard" : "🎙️ Voice Activity Leaderboard";
    const intervalLabel = interval.toUpperCase();

    const embed = new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle(`${titleType} • [${intervalLabel}]`)
      .setDescription(
        entries.length === 0
          ? "*No activity recorded for this period yet.*"
          : entries
              .map((e, index) => {
                const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `**${index + 1}.**`;
                const valueStr =
                  type === "messages"
                    ? `${(e as any)[`messages${interval.charAt(0).toUpperCase() + interval.slice(1)}`]} messages`
                    : `${Math.round(((e as any)[`voice${interval.charAt(0).toUpperCase() + interval.slice(1)}`] || 0) / 60)} mins`;
                return `${medal} <@${e.userId}> ➜ \`${valueStr}\``;
              })
              .join("\n"),
      )
      .setFooter({ text: `${guildName} • AegisX Activity Engine` })
      .setTimestamp();

    return embed;
  }
}

export const activityService = new ActivityService();
