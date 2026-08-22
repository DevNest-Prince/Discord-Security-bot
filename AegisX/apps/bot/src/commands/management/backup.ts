import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  type Message,
} from "discord.js";
import { listGuildBackups, deleteBackup } from "@aegisx/database";
import { createServerBackup, loadServerBackup } from "../../services/management/backup.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const backupCommand = {
  data: new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Full server layout and role backup & restoration system")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("create").setDescription("Create a full snapshot backup of this server"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("load")
        .setDescription("Restore server layout and roles from a backup snapshot")
        .addStringOption((opt) =>
          opt.setName("backup_id").setDescription("Backup ID code").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all saved backups for this server"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a backup snapshot")
        .addStringOption((opt) =>
          opt.setName("backup_id").setDescription("Backup ID code").setRequired(true),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      await interaction.deferReply({ ephemeral: true });
      const backupId = await createServerBackup(interaction.guild, interaction.user.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Success)
        .setTitle("💾 Server Backup Created")
        .setDescription(
          `Successfully saved full backup snapshot for **${interaction.guild.name}**!\n\n` +
          `**Backup Code:** \`${backupId}\`\n\n` +
          `*To restore this server later, run \`/backup load ${backupId}\`.*`,
        )
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } else if (sub === "load") {
      const backupId = interaction.options.getString("backup_id", true);
      await interaction.reply({
        content: `⏳ **Restoring server from backup \`${backupId}\`...** Channels and roles will now be reconstructed.`,
      });
      const res = await loadServerBackup(interaction.guild, backupId);
      if (!res.success) {
        await interaction.followUp({ content: `❌ Backup restoration failed: ${res.error}` });
      }
    } else if (sub === "list") {
      const backups = await listGuildBackups(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`💾 Server Backups • ${interaction.guild.name}`)
        .setDescription(
          backups.length === 0
            ? "*No backups found for this server.*"
            : backups
                .map(
                  (b) =>
                    `• **\`${b.backupId}\`** — Created on <t:${Math.floor(b.createdAt.getTime() / 1000)}:f> (${b.channels.length} channels, ${b.roles.length} roles)`,
                )
                .join("\n"),
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } else if (sub === "delete") {
      const backupId = interaction.options.getString("backup_id", true);
      const deleted = await deleteBackup(backupId);
      await interaction.reply({
        content: deleted ? `🗑️ Deleted backup \`${backupId}\`.` : "❌ Backup not found.",
      });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "create") {
      const msg = await message.reply({ content: "⏳ Creating server backup snapshot..." });
      const backupId = await createServerBackup(message.guild, message.author.id);
      await msg.edit({
        content: `💾 **Server Backup Created!**\n**Backup Code:** \`${backupId}\`\n*Restore using \`>backup load ${backupId}\`*`,
      });
    } else if (sub === "load") {
      const backupId = args[1];
      if (!backupId) {
        await message.reply({ content: "❌ **Usage:** `>backup load <backup_id>`" });
        return;
      }
      await message.reply({ content: `⏳ Restoring server from backup \`${backupId}\`...` });
      await loadServerBackup(message.guild, backupId);
    } else if (sub === "list") {
      const backups = await listGuildBackups(message.guild.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle("💾 Saved Backups")
        .setDescription(
          backups.length === 0
            ? "*No backups found.*"
            : backups.map((b) => `• \`${b.backupId}\` (<t:${Math.floor(b.createdAt.getTime() / 1000)}:R>)`).join("\n"),
        );
      await message.reply({ embeds: [embed] });
    } else {
      await message.reply({
        content: "💾 **Server Backup Commands:**\n• `>backup create`\n• `>backup load <id>`\n• `>backup list`\n• `>backup delete <id>`",
      });
    }
  },
};
