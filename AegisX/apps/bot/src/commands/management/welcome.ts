import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  type Message,
  type TextChannel,
} from "discord.js";
import { getGuildConfig, updateWelcomeConfig, deleteWelcomeConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";
import { formatWelcomeString } from "../../services/management/welcome.service.js";

export const welcomeCommand = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure welcome greetings and custom channel embeds")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("Set the welcome greeting channel")
        .addChannelOption((opt) =>
          opt
            .setName("target")
            .setDescription("Welcome message channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("message")
        .setDescription("Set custom welcome text message")
        .addStringOption((opt) =>
          opt
            .setName("text")
            .setDescription("Available: {user}, {user.name}, {server}, {server.member_count}")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("type")
        .setDescription("Switch between Text and Embed greeting style")
        .addStringOption((opt) =>
          opt
            .setName("style")
            .setDescription("Greeting type")
            .setRequired(true)
            .addChoices(
              { name: "Rich Embed", value: "embed" },
              { name: "Plain Text", value: "text" },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("test").setDescription("Send a preview welcome message to the configured channel"),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable the welcome greeting system"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();
    const config = await getGuildConfig(interaction.guild.id);
    const current = config.welcome || {};

    if (sub === "channel") {
      const channel = interaction.options.getChannel("target", true);
      await updateWelcomeConfig(interaction.guild.id, {
        ...current,
        channelId: channel.id,
      });
      await interaction.reply({
        content: `✅ Welcome greeting channel has been set to <#${channel.id}>.`,
      });
    } else if (sub === "message") {
      const text = interaction.options.getString("text", true);
      await updateWelcomeConfig(interaction.guild.id, {
        ...current,
        welcomeMessage: text,
      });
      await interaction.reply({
        content: `✅ Welcome message template updated!\n**Preview:** ${text}`,
      });
    } else if (sub === "type") {
      const style = interaction.options.getString("style", true);
      await updateWelcomeConfig(interaction.guild.id, {
        ...current,
        welcomeType: style,
      });
      await interaction.reply({
        content: `✅ Welcome greeting format switched to **${style === "embed" ? "Rich Embed" : "Plain Text"}**.`,
      });
    } else if (sub === "test") {
      if (!current.channelId) {
        await interaction.reply({ content: "❌ No welcome channel configured yet. Use `/welcome channel` first.", ephemeral: true });
        return;
      }
      const chan = interaction.guild.channels.cache.get(current.channelId) as TextChannel | undefined;
      if (!chan) {
        await interaction.reply({ content: "❌ Configured welcome channel no longer exists.", ephemeral: true });
        return;
      }

      const sampleMember = interaction.guild.members.cache.get(interaction.user.id)!;
      const formatted = formatWelcomeString(current.welcomeMessage || "Welcome {user} to **{server.name}**! (#{server.member_count})", sampleMember);

      if (current.welcomeType === "embed") {
        const embed = new EmbedBuilder()
          .setColor(AegisColors.Primary)
          .setTitle(`Welcome to ${interaction.guild.name}! 🎉`)
          .setDescription(formatted)
          .setThumbnail(interaction.user.displayAvatarURL())
          .setTimestamp();
        await chan.send({ embeds: [embed] });
      } else {
        await chan.send(formatted);
      }

      await interaction.reply({ content: `✅ Test welcome message sent to <#${chan.id}>!` });
    } else if (sub === "disable") {
      await deleteWelcomeConfig(interaction.guild.id);
      await interaction.reply({ content: "⚠️ Welcome greeting system has been disabled." });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return;
    const sub = args[0]?.toLowerCase();
    const config = await getGuildConfig(message.guild.id);
    const current = config.welcome || {};

    if (sub === "channel") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1] || "");
      if (!channel) {
        await message.reply({ content: "❌ Please mention a valid channel: `>welcome channel #welcome`" });
        return;
      }
      await updateWelcomeConfig(message.guild.id, { ...current, channelId: channel.id });
      await message.reply({ content: `✅ Welcome channel set to <#${channel.id}>!` });
    } else if (sub === "message") {
      const text = args.slice(1).join(" ");
      if (!text) {
        await message.reply({ content: "❌ Please provide a message: `>welcome message Welcome {user} to {server}!`" });
        return;
      }
      await updateWelcomeConfig(message.guild.id, { ...current, welcomeMessage: text });
      await message.reply({ content: `✅ Welcome message template updated!` });
    } else if (sub === "type") {
      const type = args[1]?.toLowerCase() || "";
      if (!["embed", "text"].includes(type)) {
        await message.reply({ content: "❌ Use `>welcome type embed` or `>welcome type text`" });
        return;
      }
      await updateWelcomeConfig(message.guild.id, { ...current, welcomeType: type });
      await message.reply({ content: `✅ Welcome type set to **${type}**!` });

    } else if (sub === "disable") {
      await deleteWelcomeConfig(message.guild.id);
      await message.reply({ content: "⚠️ Welcome system disabled." });
    } else {
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("👋 Welcome Greeting Setup")
        .setDescription(
          `**Usage:**\n` +
          `• \`>welcome channel <#channel>\` — Set welcome channel\n` +
          `• \`>welcome message <text>\` — Set welcome text\n` +
          `• \`>welcome type embed/text\` — Switch embed/text style\n` +
          `• \`>welcome disable\` — Disable greetings\n\n` +
          `**Variables Available:**\n` +
          `\`{user}\`, \`{user.name}\`, \`{user.id}\`, \`{server}\`, \`{server.member_count}\``
        );
      await message.reply({ embeds: [embed] });
    }
  },
};
