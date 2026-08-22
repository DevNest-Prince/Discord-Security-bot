import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type Message,
} from "discord.js";
import { emergencyService } from "../../security/emergency/emergency.service.js";

import { getGuildConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export const securityCommand = {
  data: new SlashCommandBuilder()
    .setName("security")
    .setDescription("Central Security, Quarantine, & Server Defense Control")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("View live security defense status across all modules"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("lockdown")
        .setDescription("Trigger immediate quarantine lockdown of all server channels")
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for lockdown")),
    )
    .addSubcommand((sub) =>
      sub.setName("unlock").setDescription("Restore all server channels from the pre-quarantine snapshot"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "status") {
      const config = await getGuildConfig(interaction.guild.id);
      const antinuke = config.security?.antiNuke?.enabled ? "🟢 ENABLED" : "🔴 DISABLED";
      const antibetray = config.antiBetray?.enabled ? "🟢 ENABLED" : "🔴 DISABLED";
      const limits = config.limits?.enabled ? "🟢 ENABLED" : "🔴 DISABLED";
      const automod = config.automod?.enabled ? "🟢 ENABLED" : "🔴 DISABLED";
      const jail = config.jail?.enabled ? "🟢 ENABLED" : "🔴 DISABLED";
      const raid = config.raid?.enabled ? "🟢 ENABLED" : "🔴 DISABLED";

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`🛡️ Security Defense Matrix • ${interaction.guild.name}`)
        .addFields(
          { name: "🛡️ Anti-Nuke Core", value: antinuke, inline: true },
          { name: "🔒 Anti-Betray Guardian", value: antibetray, inline: true },
          { name: "🎚️ Staff Action Limits", value: limits, inline: true },
          { name: "🚨 AutoMod Filtering", value: automod, inline: true },
          { name: "⚡ Anti-Raid Join Burst", value: raid, inline: true },
          { name: "🔒 Quarantine / Jail", value: jail, inline: true },
        )
        .setFooter({ text: "AegisX 5-Year Enterprise Security Architecture" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (sub === "lockdown") {
      await interaction.deferReply();
      const reason = interaction.options.getString("reason") || "Manual administrator lockdown";
      const count = await emergencyService.enableEmergency(interaction.guild, reason);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(AegisColors.Danger)
            .setTitle("🚨 SERVER EMERGENCY LOCKDOWN ACTIVE")
            .setDescription(
              `**Quarantined:** \`${count} channels\` locked against \`@everyone\`.\n` +
              `**Reason:** ${reason}\n\n` +
              `*To revert channels and restore permissions, run \`/security unlock\`.*`,
            )
            .setTimestamp(),
        ],
      });
    } else if (sub === "unlock") {
      await interaction.deferReply();
      const count = await emergencyService.disableEmergency(interaction.guild);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(AegisColors.Success)
            .setTitle("🔓 SERVER LOCKDOWN LIFTED")
            .setDescription(`Successfully restored original permissions across **${count}** channels!`)
            .setTimestamp(),
        ],
      });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "lockdown") {
      await emergencyService.enableEmergency(message.guild, "Prefix lockdown command");
      await message.reply({ content: "🚨 **Server quarantined! All channels locked.**" });
    } else if (sub === "unlock") {
      await emergencyService.disableEmergency(message.guild);
      await message.reply({ content: "🔓 **Server unlocked! Restored permissions.**" });
    } else {
      await message.reply({
        content: "🛡️ **Security Commands:**\n• `>security lockdown`\n• `>security unlock`\n• Slash `/security status`",
      });
    }
  },
};
