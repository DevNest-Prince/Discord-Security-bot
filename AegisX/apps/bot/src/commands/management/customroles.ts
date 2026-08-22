import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  type Message,
} from "discord.js";
import { getGuildConfig, updateInVcRoleConfig } from "@aegisx/database";

export const customrolesCommand = {
  data: new SlashCommandBuilder()
    .setName("invcrole")
    .setDescription("Configure roles automatically granted when users join any voice channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Set role to give upon joining voice channel")
        .addRoleOption((opt) => opt.setName("role").setDescription("Target role").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable In-VC auto role"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "set") {
      const role = interaction.options.getRole("role", true);
      await updateInVcRoleConfig(interaction.guild.id, {
        enabled: true,
        roleId: role.id,
      });
      await interaction.reply({
        content: `✅ **In-VC role set to <@&${role.id}>!** Members joining voice will receive this role until they disconnect.`,
      });
    } else if (sub === "disable") {
      await updateInVcRoleConfig(interaction.guild.id, {
        enabled: false,
        roleId: null,
      });
      await interaction.reply({ content: "⚠️ In-VC auto role disabled." });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageRoles)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "set") {
      const role = message.mentions.roles.first() || (args[1] ? message.guild.roles.cache.get(args[1]) : undefined);
      if (!role) {
        await message.reply({ content: "❌ **Usage:** `>invcrole set <@role>`" });
        return;
      }
      await updateInVcRoleConfig(message.guild.id, { enabled: true, roleId: role.id });
      await message.reply({ content: `✅ In-VC role set to <@&${role.id}>!` });
    } else if (sub === "disable") {
      await updateInVcRoleConfig(message.guild.id, { enabled: false, roleId: null });
      await message.reply({ content: "⚠️ In-VC role disabled." });
    } else {
      await message.reply({
        content: "🎙️ **In-VC Role Commands:**\n• `>invcrole set <@role>`\n• `>invcrole disable`",
      });
    }
  },
};
