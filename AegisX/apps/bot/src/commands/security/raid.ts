import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type Message,
} from "discord.js";
import { getGuildConfig, updateGuildConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export const raidCommand = {
  data: new SlashCommandBuilder()
    .setName("raid")
    .setDescription("Configure Anti-Raid Join Burst & Account Age Defense")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("Configure anti-raid thresholds")
        .addBooleanOption((opt) => opt.setName("enabled").setDescription("Enable anti-raid protection"))
        .addIntegerOption((opt) => opt.setName("join_threshold").setDescription("Max joins in window (default: 5)"))
        .addIntegerOption((opt) => opt.setName("window_seconds").setDescription("Detection window in seconds (default: 10)"))
        .addIntegerOption((opt) => opt.setName("min_age_days").setDescription("Min account age in days (default: 3)"))
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("Defense action upon raid detection")
            .addChoices(
              { name: "Lockdown Server", value: "lockdown" },
              { name: "Kick Suspicious Accounts", value: "kick" },
              { name: "Ban Suspicious Accounts", value: "ban" },
              { name: "Quarantine / Jail", value: "jail" },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("View current anti-raid configuration"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();
    const config = await getGuildConfig(interaction.guild.id);
    const current = config.raid || {
      enabled: false,
      joinThreshold: 5,
      windowSeconds: 10,
      minAccountAgeDays: 3,
      action: "lockdown",
    };

    if (sub === "config") {
      const enabled = interaction.options.getBoolean("enabled");
      const joinThreshold = interaction.options.getInteger("join_threshold");
      const windowSeconds = interaction.options.getInteger("window_seconds");
      const minAgeDays = interaction.options.getInteger("min_age_days");
      const action = interaction.options.getString("action") as any;

      const updated = {
        ...current,
        enabled: enabled ?? current.enabled ?? true,
        joinThreshold: joinThreshold ?? current.joinThreshold ?? 5,
        windowSeconds: windowSeconds ?? current.windowSeconds ?? 10,
        minAccountAgeDays: minAgeDays ?? current.minAccountAgeDays ?? 3,
        action: action ?? current.action ?? "lockdown",
      };

      await updateGuildConfig(interaction.guild.id, {
        ...config,
        raid: updated,
      });

      await interaction.reply({
        content: `✅ **Anti-Raid configuration updated!**\n• Status: \`${updated.enabled ? "ENABLED" : "DISABLED"}\`\n• Trigger: \`${updated.joinThreshold} joins / ${updated.windowSeconds}s\`\n• Min Age: \`${updated.minAccountAgeDays} days\`\n• Action: \`${updated.action}\``,
      });
    } else if (sub === "status") {
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("⚡ Anti-Raid Defense Matrix")
        .setDescription(
          `**Status:** \`${current.enabled ? "🟢 ENABLED" : "🔴 DISABLED"}\`\n` +
          `**Join Threshold:** \`${current.joinThreshold} joins\` within \`${current.windowSeconds}s\`\n` +
          `**Min Account Age:** \`${current.minAccountAgeDays} days\`\n` +
          `**Defense Action:** \`${current.action}\``,
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    const config = await getGuildConfig(message.guild.id);
    const current = config.raid || { enabled: false, joinThreshold: 5, windowSeconds: 10, minAccountAgeDays: 3, action: "lockdown" };
    const embed = new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle("⚡ Anti-Raid Settings")
      .setDescription(
        `**Status:** \`${current.enabled ? "ENABLED" : "DISABLED"}\`\n` +
        `**Trigger:** \`${current.joinThreshold} joins / ${current.windowSeconds}s\`\n` +
        `**Action:** \`${current.action}\`\n\n` +
        `*Use slash command \`/raid config\` for detailed tuning.*`,
      );
    await message.reply({ embeds: [embed] });
  },
};
