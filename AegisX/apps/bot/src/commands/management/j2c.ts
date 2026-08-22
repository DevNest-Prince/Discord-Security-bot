import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  type Message,
} from "discord.js";
import { getGuildConfig, updateJ2CConfig } from "@aegisx/database";

export const j2cCommand = {
  data: new SlashCommandBuilder()
    .setName("j2c")
    .setDescription("Configure Join-to-Create dynamic temporary voice channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up the Join-to-Create hub voice channel")
        .addChannelOption((opt) =>
          opt
            .setName("hub_channel")
            .setDescription("Voice channel members join to spawn dynamic VCs")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("category")
            .setDescription("Category where temp VCs will be created")
            .addChannelTypes(ChannelType.GuildCategory),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable Join-to-Create system"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "setup") {
      const hub = interaction.options.getChannel("hub_channel", true);
      const cat = interaction.options.getChannel("category");

      await updateJ2CConfig(interaction.guild.id, {
        enabled: true,
        hubChannelId: hub.id,
        categoryId: cat ? cat.id : null,
      });

      await interaction.reply({
        content: `✅ **Join-to-Create configured!** Members joining <#${hub.id}> will automatically receive private temporary voice channels.`,
      });
    } else if (sub === "disable") {
      await updateJ2CConfig(interaction.guild.id, { enabled: false, hubChannelId: null });
      await interaction.reply({ content: "⚠️ Join-to-Create disabled." });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageChannels)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "setup") {
      const hub = message.mentions.channels.first() || (args[1] ? message.guild.channels.cache.get(args[1]) : undefined);
      if (!hub || hub.type !== ChannelType.GuildVoice) {
        await message.reply({ content: "❌ **Usage:** `>j2c setup <#voiceChannel>`" });
        return;
      }

      await updateJ2CConfig(message.guild.id, {
        enabled: true,
        hubChannelId: hub.id,
        categoryId: hub.parentId || null,
      });
      await message.reply({ content: `✅ J2C Hub set to <#${hub.id}>!` });
    } else if (sub === "disable") {
      await updateJ2CConfig(message.guild.id, { enabled: false });
      await message.reply({ content: "⚠️ J2C system disabled." });
    } else {
      await message.reply({
        content: "🔊 **Join-to-Create (J2C):**\n• `>j2c setup <#voiceChannel>`\n• `>j2c disable`",
      });
    }
  },
};
