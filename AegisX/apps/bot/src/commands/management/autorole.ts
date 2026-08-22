import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  type Message,
  type Role,
} from "discord.js";
import { getGuildConfig, updateAutoRoleConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export const autoroleCommand = {
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Configure automatic role assignment for new members and bots")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("humans")
        .setDescription("Configure auto-roles for human members")
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("Add, remove, or view human auto roles")
            .setRequired(true)
            .addChoices(
              { name: "Add Role", value: "add" },
              { name: "Remove Role", value: "remove" },
              { name: "Show Config", value: "show" },
            ),
        )
        .addRoleOption((opt) => opt.setName("role").setDescription("Target role")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("bots")
        .setDescription("Configure auto-roles for invited bots")
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("Add, remove, or view bot auto roles")
            .setRequired(true)
            .addChoices(
              { name: "Add Role", value: "add" },
              { name: "Remove Role", value: "remove" },
              { name: "Show Config", value: "show" },
            ),
        )
        .addRoleOption((opt) => opt.setName("role").setDescription("Target role")),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();
    const action = interaction.options.getString("action", true);
    const role = interaction.options.getRole("role");

    const config = await getGuildConfig(interaction.guild.id);
    const current = config.autorole || { humans: [], bots: [] };
    const listKey = sub === "humans" ? "humans" : "bots";
    let list = [...(current[listKey] || [])];

    if (action === "show") {
      const roleMentions = list.map((id) => `<@&${id}>`).join(", ") || "*None configured*";
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`🎭 AutoRole Configuration • ${sub === "humans" ? "Humans" : "Bots"}`)
        .setDescription(`**Active Roles:** ${roleMentions}`)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (!role) {
      await interaction.reply({ content: "❌ Please provide a role.", ephemeral: true });
      return;
    }

    if (action === "add") {
      if (!list.includes(role.id)) list.push(role.id);
    } else if (action === "remove") {
      list = list.filter((id) => id !== role.id);
    }

    await updateAutoRoleConfig(interaction.guild.id, {
      ...current,
      [listKey]: list,
    });

    const embed = new EmbedBuilder()
      .setColor(AegisColors.Success)
      .setTitle("✅ AutoRole Updated")
      .setDescription(
        `Successfully **${action === "add" ? "added" : "removed"}** <@&${role.id}> for **${sub}**.\n\n` +
        `**Active ${sub} Roles:** ${list.map((id) => `<@&${id}>`).join(", ") || "*None*"}`,
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageRoles)) return;

    const targetType = args[0]?.toLowerCase(); // humans / bots
    const action = args[1]?.toLowerCase(); // add / remove / show
    const roleMention = message.mentions.roles.first() || (args[2] ? message.guild.roles.cache.get(args[2]) : undefined);

    const config = await getGuildConfig(message.guild.id);
    const current = config.autorole || { humans: [], bots: [] };

    if (!targetType || !["humans", "bots"].includes(targetType)) {
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("🎭 AutoRole Configuration")
        .setDescription(
          `**Usage:**\n` +
          `• \`>autorole humans add <@role>\`\n` +
          `• \`>autorole humans remove <@role>\`\n` +
          `• \`>autorole bots add <@role>\`\n` +
          `• \`>autorole bots remove <@role>\`\n\n` +
          `**Current Human Roles:** ${current.humans?.map((id) => `<@&${id}>`).join(", ") || "*None*"}\n` +
          `**Current Bot Roles:** ${current.bots?.map((id) => `<@&${id}>`).join(", ") || "*None*"}`,
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    const listKey = targetType === "humans" ? "humans" : "bots";
    let list = [...(current[listKey] || [])];

    if (action === "show" || !action) {
      const mentions = list.map((id) => `<@&${id}>`).join(", ") || "*None*";
      await message.reply({ content: `🎭 **${targetType} AutoRoles:** ${mentions}` });
      return;
    }

    if (!roleMention) {
      await message.reply({ content: "❌ Please mention a valid role or provide a role ID." });
      return;
    }

    if (action === "add") {
      if (!list.includes(roleMention.id)) list.push(roleMention.id);
    } else if (action === "remove") {
      list = list.filter((id) => id !== roleMention.id);
    }

    await updateAutoRoleConfig(message.guild.id, {
      ...current,
      [listKey]: list,
    });

    await message.reply({
      content: `✅ Successfully **${action === "add" ? "added" : "removed"}** <@&${roleMention.id}> for **${targetType}**!`,
    });
  },
};
