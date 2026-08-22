import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type Message,
  type GuildMember,
} from "discord.js";
import { moderationService } from "../../services/moderation/moderation.service.js";
import { permissionGuard } from "../../services/permissions/permission-guard.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const moderationCommand = {
  data: new SlashCommandBuilder()
    .setName("moderation")
    .setDescription("Enterprise Moderation Suite")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("ban")
        .setDescription("Ban a member from the server and record a moderation case")
        .addUserOption((opt) => opt.setName("target").setDescription("Target user to ban").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for ban"))
        .addIntegerOption((opt) => opt.setName("delete_days").setDescription("Delete message history (days)")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("unban")
        .setDescription("Unban a user by their User ID and record a moderation case")
        .addStringOption((opt) => opt.setName("user_id").setDescription("User ID to unban").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for unban")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("kick")
        .setDescription("Kick a member from the server and record a moderation case")
        .addUserOption((opt) => opt.setName("target").setDescription("Target member to kick").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for kick")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("timeout")
        .setDescription("Timeout a member for specified duration and record a moderation case")
        .addUserOption((opt) => opt.setName("target").setDescription("Target member to timeout").setRequired(true))
        .addIntegerOption((opt) =>
          opt
            .setName("duration_minutes")
            .setDescription("Duration in minutes (e.g. 5, 60, 1440)")
            .setRequired(true),
        )
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for timeout")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("untimeout")
        .setDescription("Remove timeout from a member and record a moderation case")
        .addUserOption((opt) => opt.setName("target").setDescription("Target member").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for removing timeout")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("softban")
        .setDescription("Ban and immediately unban a member to purge their messages")
        .addUserOption((opt) => opt.setName("target").setDescription("Target member to softban").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for softban")),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) return;
    const sub = interaction.options.getSubcommand();
    const moderator = interaction.member as GuildMember;

    // Check central internal permission profile
    const perm = await permissionGuard.canExecute(moderator, {
      module: "moderation",
      command: sub,
      action: sub,
      discordFallback: PermissionFlagsBits.ModerateMembers,
    });

    if (!perm.allowed) {
      await interaction.reply({
        content: `❌ **Access Denied:** ${perm.reason}`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "ban") {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason") || "No reason provided.";
      const days = interaction.options.getInteger("delete_days") || 0;
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => targetUser.id);

      const res = await moderationService.ban(interaction.guild, targetMember, moderator, reason, days);
      if (!res.success) {
        await interaction.reply({ content: `❌ Ban failed: ${res.error}`, ephemeral: true });
        return;
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(AegisColors.Danger)
            .setDescription(`🔨 **Banned <@${targetUser.id}>** • Case \`#${res.caseId}\`\n**Reason:** ${reason}`),
        ],
      });
    } else if (sub === "unban") {
      const userId = interaction.options.getString("user_id", true);
      const reason = interaction.options.getString("reason") || "No reason provided.";

      const res = await moderationService.unban(interaction.guild, userId, moderator, reason);
      if (!res.success) {
        await interaction.reply({ content: `❌ Unban failed: ${res.error}`, ephemeral: true });
        return;
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(AegisColors.Success)
            .setDescription(`🔓 **Unbanned <@${userId}>** • Case \`#${res.caseId}\`\n**Reason:** ${reason}`),
        ],
      });
    } else if (sub === "kick") {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason") || "No reason provided.";
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        await interaction.reply({ content: "❌ Member not found in server.", ephemeral: true });
        return;
      }

      const res = await moderationService.kick(interaction.guild, targetMember, moderator, reason);
      if (!res.success) {
        await interaction.reply({ content: `❌ Kick failed: ${res.error}`, ephemeral: true });
        return;
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(AegisColors.Warning)
            .setDescription(`👢 **Kicked <@${targetUser.id}>** • Case \`#${res.caseId}\`\n**Reason:** ${reason}`),
        ],
      });
    } else if (sub === "timeout") {
      const targetUser = interaction.options.getUser("target", true);
      const minutes = interaction.options.getInteger("duration_minutes", true);
      const reason = interaction.options.getString("reason") || "No reason provided.";
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        await interaction.reply({ content: "❌ Member not found in server.", ephemeral: true });
        return;
      }

      const res = await moderationService.timeout(interaction.guild, targetMember, moderator, minutes * 60, reason);
      if (!res.success) {
        await interaction.reply({ content: `❌ Timeout failed: ${res.error}`, ephemeral: true });
        return;
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(AegisColors.Warning)
            .setDescription(`⏳ **Timed out <@${targetUser.id}> for ${minutes}m** • Case \`#${res.caseId}\`\n**Reason:** ${reason}`),
        ],
      });
    } else if (sub === "untimeout") {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason") || "No reason provided.";
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) {
        await interaction.reply({ content: "❌ Member not found in server.", ephemeral: true });
        return;
      }

      const res = await moderationService.untimeout(interaction.guild, targetMember, moderator, reason);
      if (!res.success) {
        await interaction.reply({ content: `❌ Untimeout failed: ${res.error}`, ephemeral: true });
        return;
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(AegisColors.Success)
            .setDescription(`🔊 **Removed timeout for <@${targetUser.id}>** • Case \`#${res.caseId}\``),
        ],
      });
    } else if (sub === "softban") {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason") || "Softban (Message purge)";
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => targetUser.id);

      const banRes = await moderationService.ban(interaction.guild, targetMember, moderator, reason, 7);
      if (!banRes.success) {
        await interaction.reply({ content: `❌ Softban failed: ${banRes.error}`, ephemeral: true });
        return;
      }
      await interaction.guild.members.unban(targetUser.id, "Softban unban").catch(() => {});

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(AegisColors.Warning)
            .setDescription(`🧹 **Softbanned <@${targetUser.id}>** • Case \`#${banRes.caseId}\`\nMessages from the last 7 days purged.`),
        ],
      });
    }
  },
};
