import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  type Message,
} from "discord.js";
import { getGuildConfig, updateAutoReactRules } from "@aegisx/database";

export const autoreactCommand = {
  data: new SlashCommandBuilder()
    .setName("autoreact")
    .setDescription("Configure automatic emoji reactions on new messages in specific channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add auto emoji reaction to a channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("emoji")
            .setDescription("Emoji to react with (e.g. 👍 or 🔥)")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove auto reactions from a channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel("channel", true);

    const config = await getGuildConfig(interaction.guild.id);
    let rules = config.autoReact || [];

    if (sub === "add") {
      const emoji = interaction.options.getString("emoji", true);
      const existing = rules.find((r) => r.channelId === channel.id);
      if (existing) {
        if (!existing.emojis.includes(emoji)) existing.emojis.push(emoji);
      } else {
        rules.push({ channelId: channel.id, emojis: [emoji] });
      }
      await updateAutoReactRules(interaction.guild.id, rules);
      await interaction.reply({
        content: `✅ Added auto reaction ${emoji} to <#${channel.id}>!`,
      });
    } else if (sub === "remove") {
      rules = rules.filter((r) => r.channelId !== channel.id);
      await updateAutoReactRules(interaction.guild.id, rules);
      await interaction.reply({
        content: `🗑️ Removed all auto reactions from <#${channel.id}>.`,
      });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;
    const sub = args[0]?.toLowerCase();
    const channel = message.mentions.channels.first() || (args[1] ? message.guild.channels.cache.get(args[1]) : undefined);

    const config = await getGuildConfig(message.guild.id);
    let rules = config.autoReact || [];

    if (sub === "add" && channel && args[2]) {
      const emoji = args[2];
      const existing = rules.find((r) => r.channelId === channel.id);
      if (existing) {
        if (!existing.emojis.includes(emoji)) existing.emojis.push(emoji);
      } else {
        rules.push({ channelId: channel.id, emojis: [emoji] });
      }
      await updateAutoReactRules(message.guild.id, rules);
      await message.reply({ content: `✅ Added auto reaction ${emoji} to <#${channel.id}>!` });
    } else if (sub === "remove" && channel) {
      rules = rules.filter((r) => r.channelId !== channel.id);
      await updateAutoReactRules(message.guild.id, rules);
      await message.reply({ content: `🗑️ Removed auto reactions from <#${channel.id}>!` });
    } else {
      await message.reply({
        content: "⚡ **AutoReact:**\n• `>autoreact add <#channel> <emoji>`\n• `>autoreact remove <#channel>`",
      });
    }
  },
};
