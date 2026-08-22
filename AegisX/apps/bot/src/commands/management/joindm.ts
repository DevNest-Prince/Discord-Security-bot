import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  type Message,
} from "discord.js";
import { getGuildConfig, updateJoinDmConfig } from "@aegisx/database";

export const joindmCommand = {
  data: new SlashCommandBuilder()
    .setName("joindm")
    .setDescription("Configure direct message greetings automatically sent to newly joined members")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Set custom welcome DM message")
        .addStringOption((opt) =>
          opt
            .setName("message")
            .setDescription("Available: {user}, {server}, {server.member_count}")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable welcome direct messages"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "set") {
      const msg = interaction.options.getString("message", true);
      await updateJoinDmConfig(interaction.guild.id, {
        enabled: true,
        message: msg,
      });
      await interaction.reply({
        content: `✅ **JoinDM greeting set!** New members will receive:\n>>> ${msg}`,
      });
    } else if (sub === "disable") {
      await updateJoinDmConfig(interaction.guild.id, { enabled: false, message: null });
      await interaction.reply({ content: "⚠️ JoinDM disabled." });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "set") {
      const msg = args.slice(1).join(" ");
      if (!msg) {
        await message.reply({ content: "❌ **Usage:** `>joindm set Welcome to {server}, {user}!`" });
        return;
      }
      await updateJoinDmConfig(message.guild.id, { enabled: true, message: msg });
      await message.reply({ content: `✅ JoinDM greeting configured!` });
    } else if (sub === "disable") {
      await updateJoinDmConfig(message.guild.id, { enabled: false });
      await message.reply({ content: "⚠️ JoinDM disabled." });
    } else {
      await message.reply({
        content: "📩 **JoinDM Commands:**\n• `>joindm set <message>`\n• `>joindm disable`",
      });
    }
  },
};
