import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { getGuildConfig, updateAntiBetrayConfig } from "@aegisx/database";
import { deleteGuildConfigCache } from "@aegisx/redis";

export const antibetrayCommand = {
  data: new SlashCommandBuilder()
    .setName("antibetray")
    .setDescription("Configure Anti-Betray internal staff protection")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("enable").setDescription("Enable Anti-Betray monitoring"),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable Anti-Betray monitoring"),
    )
    .addSubcommand((sub) =>
      sub.setName("config").setDescription("View current Anti-Betray configuration"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({ content: "❌ Server only command.", ephemeral: true });
      return;
    }

    const guild = interaction.guild;
    const authorId = interaction.user.id;
    const isOwner = guild.ownerId === authorId;

    if (!isOwner) {
      await interaction.reply({
        content: "❌ **Access Denied**: Only the primary Server Owner can manage Anti-Betray settings.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const config = await getGuildConfig(guild.id);

    if (subcommand === "enable") {
      await updateAntiBetrayConfig(guild.id, { enabled: true });
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🔒 Anti-Betray Monitoring Activated")
            .setColor(0x00ff00)
            .setDescription(
              `Anti-Betray is now **ACTIVE** for **${guild.name}**.\n\n` +
              `• Staff performing mass unauthorized actions will be immediately demoted.\n` +
              `• Server will auto-lockdown to prevent nuke damage.\n` +
              `• Primary Server Owner will receive instant DM alerts.`,
            ),
        ],
      });
    } else if (subcommand === "disable") {
      await updateAntiBetrayConfig(guild.id, { enabled: false });
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🔒 Anti-Betray Disabled")
            .setColor(0xff0000)
            .setDescription("🔴 Anti-Betray monitoring has been deactivated."),
        ],
      });
    } else if (subcommand === "config") {
      const antiBetray = config.antiBetray;
      const isEnabled = antiBetray?.enabled ?? false;

      const embed = new EmbedBuilder()
        .setTitle(`🔒 Anti-Betray Configuration — ${guild.name}`)
        .setColor(isEnabled ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "Status", value: isEnabled ? "🟢 **ENABLED**" : "🔴 **DISABLED**", inline: true },
          { name: "Max Suspicious Actions", value: `${antiBetray?.maxSuspiciousActions ?? 3}`, inline: true },
          { name: "Action on Betrayal", value: `\`${(antiBetray?.action ?? "demote").toUpperCase()}\``, inline: true },
          { name: "Auto Lockdown", value: "✅ Enabled", inline: true },
          { name: "Owner DM Alerts", value: "✅ Enabled", inline: true },
        );

      await interaction.reply({ embeds: [embed] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    const guild = message.guild;
    const isOwner = guild.ownerId === message.author.id;

    if (!isOwner) {
      await message.reply("❌ **Access Denied**: Only primary Server Owner can manage Anti-Betray.");
      return;
    }

    const sub = args[0]?.toLowerCase();
    const config = await getGuildConfig(guild.id);

    if (sub === "enable") {
      await updateAntiBetrayConfig(guild.id, { enabled: true });
      await deleteGuildConfigCache(guild.id);
      await message.reply("✅ **Anti-Betray monitoring is now ACTIVE!**");
    } else if (sub === "disable") {
      await updateAntiBetrayConfig(guild.id, { enabled: false });
      await deleteGuildConfigCache(guild.id);
      await message.reply("🔴 **Anti-Betray monitoring has been disabled.**");
    } else {
      const isEnabled = config.antiBetray?.enabled ?? false;
      const embed = new EmbedBuilder()
        .setTitle(`🔒 Anti-Betray Configuration — ${guild.name}`)
        .setColor(isEnabled ? 0x00ff00 : 0xff0000)
        .setDescription(`Status: ${isEnabled ? "🟢 **ENABLED**" : "🔴 **DISABLED**"}\nUse \`>antibetray enable\` or \`>antibetray disable\`.`);
      await message.reply({ embeds: [embed] });
    }
  },
};
