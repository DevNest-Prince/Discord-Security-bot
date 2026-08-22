import {
  type Message,
  type TextChannel,
  EmbedBuilder,
} from "discord.js";
import {
  getGuildConfig,
  addMessageXp,
  getUserLevel,
  getUserRank,
  getGuildLeaderboard,
  type UserLevel,
} from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

const xpCooldowns = new Map<string, number>();

export async function handleMessageXp(message: Message): Promise<void> {
  if (!message.guild || message.author.bot) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const cooldownKey = `${guildId}:${userId}`;

  const config = await getGuildConfig(guildId);
  const leveling = config.leveling;
  if (!leveling || !leveling.enabled) return;

  const now = Date.now();
  const lastXp = xpCooldowns.get(cooldownKey) || 0;
  const cooldownMs = (leveling.cooldownSeconds || 60) * 1000;

  if (now - lastXp < cooldownMs) return;
  xpCooldowns.set(cooldownKey, now);

  const xpEarned = leveling.xpPerMessage || 20;
  const result = await addMessageXp(guildId, userId, xpEarned);

  if (result.leveledUp) {
    const notifyChannel = leveling.levelUpChannelId
      ? (message.guild.channels.cache.get(leveling.levelUpChannelId) as TextChannel | undefined)
      : (message.channel as TextChannel);

    if (notifyChannel && notifyChannel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Gold)
        .setTitle("🎉 Level Up!")
        .setDescription(`Congratulations <@${userId}>! You have reached **Level ${result.newLevel}**! 🚀`)
        .setThumbnail(message.author.displayAvatarURL({ size: 128 }))
        .setFooter({ text: "Keep chatting to earn more XP!" })
        .setTimestamp();

      await notifyChannel.send({ embeds: [embed] }).catch(() => {});
    }
  }
}

export async function buildRankEmbed(
  guildId: string,
  userId: string,
  userTag: string,
  avatarUrl: string,
): Promise<EmbedBuilder> {
  const userLevel = await getUserLevel(guildId, userId);
  const rank = await getUserRank(guildId, userId);

  // Next level formula: 5 * (lvl ^ 2) + 50 * lvl + 100
  const nextLvlXp = 5 * Math.pow(userLevel.level + 1, 2) + 50 * (userLevel.level + 1) + 100;
  const currLvlXp = 5 * Math.pow(userLevel.level, 2) + 50 * userLevel.level + 100;
  const neededXp = nextLvlXp - currLvlXp;
  const progressXp = Math.max(0, userLevel.xp - currLvlXp);
  const progressPercent = Math.min(100, Math.round((progressXp / neededXp) * 100));

  const progressBar = "█".repeat(Math.floor(progressPercent / 10)) + "░".repeat(10 - Math.floor(progressPercent / 10));

  return new EmbedBuilder()
    .setColor(AegisColors.Primary)
    .setTitle(`📊 Rank Card • ${userTag}`)
    .setThumbnail(avatarUrl)
    .addFields(
      { name: "🏆 Rank", value: `#${rank}`, inline: true },
      { name: "⭐ Level", value: `${userLevel.level}`, inline: true },
      { name: "✨ Total XP", value: `${userLevel.xp.toLocaleString()}`, inline: true },
      { name: "💬 Messages", value: `${userLevel.messages.toLocaleString()}`, inline: true },
      { name: `📈 Progress (${progressPercent}%)`, value: `\`[${progressBar}]\` (${progressXp}/${neededXp} XP)`, inline: false },
    )
    .setTimestamp();
}

export async function buildLeaderboardEmbed(
  guildId: string,
  guildName: string,
  guildIconUrl?: string | null,
): Promise<EmbedBuilder> {
  const leaders = await getGuildLeaderboard(guildId, 10);

  const embed = new EmbedBuilder()
    .setColor(AegisColors.Gold)
    .setTitle(`🏆 Server XP Leaderboard • ${guildName}`)
    .setDescription(
      leaders.length === 0
        ? "*No XP activity recorded yet. Start sending messages to rank up!*"
        : leaders
            .map((u, i) => {
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**#${i + 1}**`;
              return `${medal} <@${u.userId}> — **Lvl ${u.level}** (${u.xp.toLocaleString()} XP • ${u.messages} msgs)`;
            })
            .join("\n\n"),
    )
    .setTimestamp();

  if (guildIconUrl) embed.setThumbnail(guildIconUrl);
  return embed;
}
