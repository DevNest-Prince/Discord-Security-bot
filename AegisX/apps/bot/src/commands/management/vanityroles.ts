import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  type Message,
} from "discord.js";
import { getGuildConfig, setVanityRole, removeVanityRole } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export const vanityrolesCommand = {
  data: new SlashCommandBuilder()
    .setName("vanityrole")
    .setDescription("Reward members who put server vanity or invite URL in their Discord custom status")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Add vanity keyword trigger and target role")
        .addStringOption((opt) =>
          opt
            .setName("vanity")
            .setDescription("Keyword to look for (e.g. .gg/aegisx or /aegis)")
            .setRequired(true),
        )
        .addRoleOption((opt) =>
          opt
            .setName("role")
            .setDescription("Role to award")
            .setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("log_channel")
            .setDescription("Audit log channel for vanity triggers")
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a vanity keyword setup")
        .addStringOption((opt) =>
          opt
            .setName("vanity")
            .setDescription("Vanity keyword to remove")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all active vanity role triggers"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "set") {
      const vanity = interaction.options.getString("vanity", true);
      const role = interaction.options.getRole("role", true);
      const logChannel = interaction.options.getChannel("log_channel");

      await setVanityRole(interaction.guild.id, {
        vanity,
        roleId: role.id,
        logChannelId: logChannel ? logChannel.id : null,
      });

      await interaction.reply({
        content: `✨ **Vanity trigger configured!** Members with \`${vanity}\` in their custom status will automatically receive <@&${role.id}>.`,
      });
    } else if (sub === "remove") {
      const vanity = interaction.options.getString("vanity", true);
      await removeVanityRole(interaction.guild.id, vanity);
      await interaction.reply({ content: `🗑️ Removed vanity trigger for \`${vanity}\`.` });
    } else if (sub === "list") {
      const config = await getGuildConfig(interaction.guild.id);
      const setups = config.vanityRoles || [];

      if (setups.length === 0) {
        await interaction.reply({ content: "ℹ️ No vanity role triggers configured in this server." });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("✨ Active Vanity Status Triggers")
        .setDescription(
          setups
            .map(
              (s, i) =>
                `**${i + 1}.** Keyword: \`${s.vanity}\` ➜ Role: <@&${s.roleId}> ${s.logChannelId ? `(Logs: <#${s.logChannelId}>)` : ""}`,
            )
            .join("\n"),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "set") {
      const vanity = args[1];
      const role = message.mentions.roles.first() || (args[2] ? message.guild.roles.cache.get(args[2]) : undefined);
      if (!vanity || !role) {
        await message.reply({ content: "❌ **Usage:** `>vanityrole set <vanity_text> <@role>`" });
        return;
      }
      await setVanityRole(message.guild.id, { vanity, roleId: role.id });
      await message.reply({ content: `✨ Vanity role trigger set for \`${vanity}\` ➜ <@&${role.id}>!` });
    } else if (sub === "remove") {
      const vanity = args[1];
      if (!vanity) {
        await message.reply({ content: "❌ **Usage:** `>vanityrole remove <vanity_text>`" });
        return;
      }
      await removeVanityRole(message.guild.id, vanity);
      await message.reply({ content: `🗑️ Removed vanity role trigger for \`${vanity}\`.` });
    } else {
      const config = await getGuildConfig(message.guild.id);
      const setups = config.vanityRoles || [];
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("✨ Vanity Roles Setup")
        .setDescription(
          `**Usage:**\n` +
          `• \`>vanityrole set <vanity_text> <@role>\`\n` +
          `• \`>vanityrole remove <vanity_text>\`\n` +
          `• \`>vanityrole list\`\n\n` +
          `**Active Triggers:**\n` +
          (setups.length === 0 ? "*None*" : setups.map((s) => `• \`${s.vanity}\` ➜ <@&${s.roleId}>`).join("\n")),
        );
      await message.reply({ embeds: [embed] });
    }
  },
};
