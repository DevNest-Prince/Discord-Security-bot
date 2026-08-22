import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  type Message,
  type TextChannel,
} from "discord.js";
import { getGuildConfig, updateGuildConfig } from "@aegisx/database";
import { goodbyeService } from "../../services/management/goodbye.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const goodbyeCommand = {
  data: new SlashCommandBuilder()
    .setName("goodbye")
    .setDescription("Configure leave greeting announcements and custom farewell embeds")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("Set the destination channel for goodbye messages")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Goodbye channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("message")
        .setDescription("Set custom farewell message")
        .addStringOption((opt) =>
          opt
            .setName("template")
            .setDescription("Available: {username}, {server}, {memberCount}")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("preview").setDescription("Test and preview current goodbye message"),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable the goodbye farewell system"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();
    const config = await getGuildConfig(interaction.guild.id);
    const current = config.goodbye || {
      enabled: false,
      channelId: null,
      message: null,
      embedData: null,
      autoDeleteDuration: null,
    };

    if (sub === "channel") {
      const channel = interaction.options.getChannel("channel", true);
      const updated = { ...current, enabled: true, channelId: channel.id };
      await updateGuildConfig(interaction.guild.id, { ...config, goodbye: updated });
      await interaction.reply({ content: `✅ Goodbye announcements directed to <#${channel.id}>!` });
    } else if (sub === "message") {
      const template = interaction.options.getString("template", true);
      const updated = { ...current, enabled: true, message: template };
      await updateGuildConfig(interaction.guild.id, { ...config, goodbye: updated });
      await interaction.reply({ content: `✅ Goodbye message template saved:\n>>> ${template}` });
    } else if (sub === "preview") {
      const raw = current.message || "👋 Goodbye **{username}**! We are now at **{memberCount}** members.";
      const text = goodbyeService.parseVariables(
        raw,
        interaction.user,
        interaction.guild.name,
        interaction.guild.memberCount,
      );

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Dark)
        .setTitle(`Member Left • ${interaction.guild.name}`)
        .setDescription(text)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `Preview Mode • AegisX Goodbye` });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === "disable") {
      const updated = { ...current, enabled: false };
      await updateGuildConfig(interaction.guild.id, { ...config, goodbye: updated });
      await interaction.reply({ content: "⚠️ Goodbye greetings disabled." });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return;
    const sub = args[0]?.toLowerCase();
    const config = await getGuildConfig(message.guild.id);

    if (sub === "channel") {
      const channel = message.mentions.channels.first() || (args[1] ? message.guild.channels.cache.get(args[1]) : undefined);
      if (!channel) {
        await message.reply({ content: "❌ **Usage:** `>goodbye channel <#channel>`" });
        return;
      }
      await updateGuildConfig(message.guild.id, {
        ...config,
        goodbye: { ...(config.goodbye || {}), enabled: true, channelId: channel.id },
      });
      await message.reply({ content: `✅ Goodbye channel set to <#${channel.id}>!` });
    } else if (sub === "message") {
      const text = args.slice(1).join(" ");
      if (!text) {
        await message.reply({ content: "❌ **Usage:** `>goodbye message Goodbye {username}!`" });
        return;
      }
      await updateGuildConfig(message.guild.id, {
        ...config,
        goodbye: { ...(config.goodbye || {}), enabled: true, message: text },
      });
      await message.reply({ content: `✅ Goodbye message set!` });
    } else {
      await message.reply({
        content: "👋 **Goodbye Commands:**\n• `>goodbye channel <#channel>`\n• `>goodbye message <text>`\n• `>goodbye preview`",
      });
    }
  },
};
