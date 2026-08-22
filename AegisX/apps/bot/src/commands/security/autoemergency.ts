import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type Message,
} from "discord.js";
import { getGuildConfig, updateGuildConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export const autoEmergencyCommand = {
  data: new SlashCommandBuilder()
    .setName("autoemergency")
    .setDescription("Automatic Emergency Quarantine Protocol upon coordinated attack detection")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("Configure auto emergency thresholds")
        .addBooleanOption((opt) => opt.setName("enabled").setDescription("Enable auto emergency protocol"))
        .addIntegerOption((opt) => opt.setName("threshold").setDescription("Max security alerts in window (default: 3)"))
        .addIntegerOption((opt) => opt.setName("window_seconds").setDescription("Detection window in seconds (default: 30)"))
        .addBooleanOption((opt) => opt.setName("quarantine_channels").setDescription("Lock all channels during attack"))
        .addBooleanOption((opt) => opt.setName("strip_rogue_roles").setDescription("Strip administrative roles from rogue actors")),
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("View live Auto Emergency configuration"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();
    const config = await getGuildConfig(interaction.guild.id);
    const current = config.autoEmergency || {
      enabled: false,
      triggerThreshold: 3,
      windowSeconds: 30,
      quarantineChannels: true,
      stripRogueRoles: true,
      logChannelId: null,
    };

    if (sub === "config") {
      const enabled = interaction.options.getBoolean("enabled");
      const threshold = interaction.options.getInteger("threshold");
      const windowSeconds = interaction.options.getInteger("window_seconds");
      const quarantineChannels = interaction.options.getBoolean("quarantine_channels");
      const stripRogueRoles = interaction.options.getBoolean("strip_rogue_roles");

      const updated = {
        ...current,
        enabled: enabled ?? current.enabled ?? true,
        triggerThreshold: threshold ?? current.triggerThreshold ?? 3,
        windowSeconds: windowSeconds ?? current.windowSeconds ?? 30,
        quarantineChannels: quarantineChannels ?? current.quarantineChannels ?? true,
        stripRogueRoles: stripRogueRoles ?? current.stripRogueRoles ?? true,
      };

      await updateGuildConfig(interaction.guild.id, {
        ...config,
        autoEmergency: updated,
      });

      await interaction.reply({
        content: `✅ **Auto Emergency protocol updated!**\n• Status: \`${updated.enabled ? "ENABLED" : "DISABLED"}\`\n• Trigger: \`${updated.triggerThreshold} events / ${updated.windowSeconds}s\`\n• Lockdown Channels: \`${updated.quarantineChannels ? "Yes" : "No"}\``,
      });
    } else if (sub === "status") {
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("⚔️ Auto Emergency Protocol")
        .setDescription(
          `**Status:** \`${current.enabled ? "🟢 ACTIVE" : "🔴 DISABLED"}\`\n` +
          `**Trigger:** \`${current.triggerThreshold} alerts\` in \`${current.windowSeconds}s\`\n` +
          `**Lockdown Channels:** \`${current.quarantineChannels ? "Enabled" : "Disabled"}\`\n` +
          `**Strip Attacker Roles:** \`${current.stripRogueRoles ? "Enabled" : "Disabled"}\``,
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    const config = await getGuildConfig(message.guild.id);
    const current = config.autoEmergency || { enabled: false, triggerThreshold: 3, windowSeconds: 30, quarantineChannels: true };

    const embed = new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle("⚔️ Auto Emergency Settings")
      .setDescription(
        `**Status:** \`${current.enabled ? "ENABLED" : "DISABLED"}\`\n` +
        `**Trigger:** \`${current.triggerThreshold} events / ${current.windowSeconds}s\`\n\n` +
        `*Use slash command \`/autoemergency config\` to tune parameters.*`,
      );
    await message.reply({ embeds: [embed] });
  },
};
