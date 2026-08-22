import {
  type Client,
  type Guild,
  type TextChannel,
  type User,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import {
  createGiveaway,
  getGiveawayByMessageId,
  getActiveGiveaways,
  getDueGiveaways,
  endGiveaway,
  addParticipant,
  removeParticipant,
  deleteGiveaway,
  type GiveawayRecord,
} from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export class GiveawayService {
  /**
   * Starts a new persistent giveaway
   */
  async startGiveaway(params: {
    guild: Guild;
    channel: TextChannel;
    host: User;
    prize: string;
    winnerCount: number;
    durationMs: number;
    requiredRoles?: string[];
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const endsAt = new Date(Date.now() + params.durationMs);

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`🎉 GIVEAWAY: ${params.prize}`)
        .setDescription(
          `Click the **🎉 Enter Giveaway** button below to participate!\n\n` +
          `• **Winners:** \`${params.winnerCount}\`\n` +
          `• **Hosted By:** <@${params.host.id}>\n` +
          `• **Ends At:** <t:${Math.floor(endsAt.getTime() / 1000)}:R> (<t:${Math.floor(endsAt.getTime() / 1000)}:f>)\n` +
          (params.requiredRoles && params.requiredRoles.length > 0
            ? `• **Required Roles:** ${params.requiredRoles.map((r) => `<@&${r}>`).join(", ")}\n`
            : ""),
        )
        .setFooter({ text: `0 Entries • Ends` })
        .setTimestamp(endsAt);

      const btn = new ButtonBuilder()
        .setCustomId("aegis_giveaway_enter")
        .setLabel("Enter Giveaway")
        .setEmoji("🎉")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

      const msg = await params.channel.send({ embeds: [embed], components: [row] });

      await createGiveaway({
        guildId: params.guild.id,
        channelId: params.channel.id,
        messageId: msg.id,
        prize: params.prize,
        winnerCount: params.winnerCount,
        hostId: params.host.id,
        requiredRoles: params.requiredRoles || [],
        endsAt,
        ended: false,
        winners: [],
        participants: [],
      });

      return { success: true, messageId: msg.id };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  /**
   * Ends a giveaway and picks winners
   */
  async finishGiveaway(client: Client, giveaway: GiveawayRecord): Promise<string[]> {
    try {
      const guild = client.guilds.cache.get(giveaway.guildId);
      if (!guild) {
        await endGiveaway(giveaway.messageId, []);
        return [];
      }

      const channel = guild.channels.cache.get(giveaway.channelId) as TextChannel | null;
      if (!channel) {
        await endGiveaway(giveaway.messageId, []);
        return [];
      }

      const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);

      const pool = [...giveaway.participants];
      const winners: string[] = [];

      // Pick random winners
      const count = Math.min(giveaway.winnerCount, pool.length);
      for (let i = 0; i < count; i++) {
        const randIndex = Math.floor(Math.random() * pool.length);
        winners.push(pool.splice(randIndex, 1)[0]!);
      }

      await endGiveaway(giveaway.messageId, winners);

      if (message) {
        const endedEmbed = new EmbedBuilder()
          .setColor(winners.length > 0 ? AegisColors.Success : AegisColors.Dark)
          .setTitle(`🎉 GIVEAWAY ENDED: ${giveaway.prize}`)
          .setDescription(
            `• **Hosted By:** <@${giveaway.hostId}>\n` +
            `• **Total Entries:** \`${giveaway.participants.length}\`\n\n` +
            (winners.length > 0
              ? `🏆 **Winner(s):** ${winners.map((w) => `<@${w}>`).join(", ")}`
              : `*No valid entries. No winners picked.*`),
          )
          .setTimestamp();

        const disabledBtn = new ButtonBuilder()
          .setCustomId("aegis_giveaway_ended")
          .setLabel("Giveaway Ended")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true);

        await message.edit({
          embeds: [endedEmbed],
          components: [new ActionRowBuilder<ButtonBuilder>().addComponents(disabledBtn)],
        });

        if (winners.length > 0) {
          await channel.send({
            content: `🎉 Congratulations ${winners.map((w) => `<@${w}>`).join(", ")}! You won **${giveaway.prize}**!`,
          });
        }
      }

      return winners;
    } catch (err) {
      console.error("❌ Failed to finish giveaway:", err);
      return [];
    }
  }

  /**
   * Rerolls a winner for an ended giveaway
   */
  async rerollGiveaway(client: Client, messageId: string): Promise<{ success: boolean; winner?: string; error?: string }> {
    const record = await getGiveawayByMessageId(messageId);
    if (!record) return { success: false, error: "Giveaway not found." };
    if (!record.ended) return { success: false, error: "This giveaway is still active." };
    if (record.participants.length === 0) return { success: false, error: "No participants to pick from." };

    const randWinner = record.participants[Math.floor(Math.random() * record.participants.length)]!;

    const guild = client.guilds.cache.get(record.guildId);
    const channel = guild?.channels.cache.get(record.channelId) as TextChannel | null;
    if (channel) {
      await channel.send({
        content: `🎉 **Reroll:** Congratulations <@${randWinner}>! You are the new winner of **${record.prize}**!`,
      });
    }

    return { success: true, winner: randWinner };
  }

  /**
   * Background sweep loop for ended giveaways
   */
  async processDueGiveaways(client: Client): Promise<void> {
    const due = await getDueGiveaways();
    for (const g of due) {
      await this.finishGiveaway(client, g);
    }
  }
}

export const giveawayService = new GiveawayService();
