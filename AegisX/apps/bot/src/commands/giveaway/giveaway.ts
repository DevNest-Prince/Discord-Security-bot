import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  type TextChannel,
  type Message,
  EmbedBuilder,
} from "discord.js";
import { giveawayService } from "../../services/giveaway/giveaway.service.js";
import { getActiveGiveaways, endGiveaway, deleteGiveaway } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export const giveawayCommand = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Enterprise Persistent Giveaway Suite")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start a new giveaway")
        .addStringOption((opt) => opt.setName("prize").setDescription("Prize to win").setRequired(true))
        .addIntegerOption((opt) => opt.setName("duration_minutes").setDescription("Duration in minutes").setRequired(true))
        .addIntegerOption((opt) => opt.setName("winners").setDescription("Number of winners (default: 1)"))
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Channel to host the giveaway in")
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End an active giveaway immediately and pick winners")
        .addStringOption((opt) => opt.setName("message_id").setDescription("Giveaway message ID").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("reroll")
        .setDescription("Reroll winners for an ended giveaway")
        .addStringOption((opt) => opt.setName("message_id").setDescription("Giveaway message ID").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all currently active giveaways in this server"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "start") {
      const prize = interaction.options.getString("prize", true);
      const minutes = interaction.options.getInteger("duration_minutes", true);
      const winners = interaction.options.getInteger("winners") || 1;
      const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;

      await interaction.deferReply({ ephemeral: true });

      const res = await giveawayService.startGiveaway({
        guild: interaction.guild,
        channel,
        host: interaction.user,
        prize,
        winnerCount: winners,
        durationMs: minutes * 60 * 1000,
      });

      if (!res.success) {
        await interaction.editReply({ content: `❌ Failed to start giveaway: ${res.error}` });
        return;
      }

      await interaction.editReply({
        content: `🎉 **Giveaway started in <#${channel.id}>!** Prize: **${prize}** | Winners: \`${winners}\``,
      });
    } else if (sub === "end") {
      const msgId = interaction.options.getString("message_id", true);
      const active = await getActiveGiveaways(interaction.guild.id);
      const target = active.find((g) => g.messageId === msgId);

      if (!target) {
        await interaction.reply({ content: "❌ Active giveaway with that Message ID not found.", ephemeral: true });
        return;
      }

      await interaction.deferReply();
      const winners = await giveawayService.finishGiveaway(interaction.client, target);
      await interaction.editReply({
        content: winners.length > 0
          ? `🏆 **Giveaway ended!** Winners: ${winners.map((w) => `<@${w}>`).join(", ")}`
          : "⚠️ Giveaway ended, but no participants entered.",
      });
    } else if (sub === "reroll") {
      const msgId = interaction.options.getString("message_id", true);
      await interaction.deferReply();
      const res = await giveawayService.rerollGiveaway(interaction.client, msgId);
      if (!res.success) {
        await interaction.editReply({ content: `❌ Reroll failed: ${res.error}` });
      } else {
        await interaction.editReply({ content: `🎉 **New Winner Rerolled:** <@${res.winner}>!` });
      }
    } else if (sub === "list") {
      const active = await getActiveGiveaways(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`🎉 Active Giveaways • ${interaction.guild.name}`)
        .setDescription(
          active.length === 0
            ? "*No active giveaways running.*"
            : active
                .map(
                  (g, i) =>
                    `**${i + 1}.** **${g.prize}** (<#${g.channelId}>)\n• Ends: <t:${Math.floor(g.endsAt.getTime() / 1000)}:R> | Winners: \`${g.winnerCount}\` | Msg: \`${g.messageId}\``,
                )
                .join("\n\n"),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "start" || sub === "gstart") {
      const minutes = parseInt(args[1] || "10", 10);
      const winners = parseInt(args[2] || "1", 10);
      const prize = args.slice(3).join(" ") || "Discord Nitro";

      const channel = message.channel as TextChannel;
      const res = await giveawayService.startGiveaway({
        guild: message.guild,
        channel,
        host: message.author,
        prize,
        winnerCount: winners,
        durationMs: minutes * 60 * 1000,
      });

      if (res.success) {
        await message.reply({ content: `🎉 **Giveaway started!** Prize: **${prize}**` });
      }
    } else if (sub === "reroll" || sub === "greroll") {
      const msgId = args[1];
      if (!msgId) {
        await message.reply({ content: "❌ **Usage:** `>giveaway reroll <message_id>`" });
        return;
      }
      const res = await giveawayService.rerollGiveaway(message.client, msgId);
      await message.reply({ content: res.success ? `🎉 **New Winner:** <@${res.winner}>!` : `❌ ${res.error}` });
    } else {
      await message.reply({
        content: "🎉 **Giveaway Commands:**\n• `>giveaway start <minutes> <winners> <prize>`\n• `>giveaway reroll <message_id>`\n• `/giveaway list`",
      });
    }
  },
};
