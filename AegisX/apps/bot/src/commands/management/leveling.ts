import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  type Message,
} from "discord.js";
import { getGuildConfig, updateLevelingConfig } from "@aegisx/database";
import { buildRankEmbed, buildLeaderboardEmbed } from "../../services/management/leveling.service.js";

export const levelingCommand = {
  data: new SlashCommandBuilder()
    .setName("leveling")
    .setDescription("XP, Leveling, and Leaderboard suite")
    .addSubcommand((sub) =>
      sub
        .setName("rank")
        .setDescription("View your current XP, level, and server rank")
        .addUserOption((opt) => opt.setName("user").setDescription("User to view")),
    )
    .addSubcommand((sub) =>
      sub.setName("leaderboard").setDescription("View the server XP leaderboard"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("Configure leveling system")
        .addBooleanOption((opt) => opt.setName("enabled").setDescription("Enable or disable XP"))
        .addIntegerOption((opt) => opt.setName("xp_per_message").setDescription("XP given per message (default: 20)"))
        .addChannelOption((opt) =>
          opt
            .setName("levelup_channel")
            .setDescription("Channel for level up announcements")
            .addChannelTypes(ChannelType.GuildText),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "rank") {
      const target = interaction.options.getUser("user") || interaction.user;
      const embed = await buildRankEmbed(
        interaction.guild.id,
        target.id,
        target.tag,
        target.displayAvatarURL({ size: 256 }),
      );
      await interaction.reply({ embeds: [embed] });
    } else if (sub === "leaderboard") {
      const embed = await buildLeaderboardEmbed(
        interaction.guild.id,
        interaction.guild.name,
        interaction.guild.iconURL(),
      );
      await interaction.reply({ embeds: [embed] });
    } else if (sub === "config") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "❌ You need `Manage Server` permissions to configure leveling.", ephemeral: true });
        return;
      }

      const enabled = interaction.options.getBoolean("enabled");
      const xpPerMessage = interaction.options.getInteger("xp_per_message");
      const levelUpChan = interaction.options.getChannel("levelup_channel");

      const config = await getGuildConfig(interaction.guild.id);
      const current = config.leveling || {};

      await updateLevelingConfig(interaction.guild.id, {
        enabled: enabled ?? current.enabled ?? true,
        xpPerMessage: xpPerMessage ?? current.xpPerMessage ?? 20,
        levelUpChannelId: levelUpChan ? levelUpChan.id : current.levelUpChannelId,
      });

      await interaction.reply({ content: "✅ Leveling settings updated successfully!" });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "leaderboard" || sub === "top") {
      const embed = await buildLeaderboardEmbed(
        message.guild.id,
        message.guild.name,
        message.guild.iconURL(),
      );
      await message.reply({ embeds: [embed] });
    } else {
      const target = message.mentions.users.first() || message.author;
      const embed = await buildRankEmbed(
        message.guild.id,
        target.id,
        target.tag,
        target.displayAvatarURL({ size: 256 }),
      );
      await message.reply({ embeds: [embed] });
    }
  },
};
