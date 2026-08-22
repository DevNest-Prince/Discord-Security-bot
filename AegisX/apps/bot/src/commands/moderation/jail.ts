import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type GuildMember,
  type Message,
} from "discord.js";
import { jailService } from "../../services/jail/jail.service.js";
import {
  getGuildConfig,
  getActiveJailSession,
  listActiveJails,
  getUserJailHistory,
} from "@aegisx/database";
import { permissionGuard } from "../../services/permissions/permission-guard.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const jailCommand = {
  data: new SlashCommandBuilder()
    .setName("jail")
    .setDescription("Enterprise Quarantine & Jail Isolation Suite")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Quarantine and jail a member")
        .addUserOption((opt) => opt.setName("target").setDescription("Member to jail").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for jail").setRequired(true))
        .addIntegerOption((opt) =>
          opt.setName("duration_minutes").setDescription("Duration in minutes (omit for permanent)"),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("release")
        .setDescription("Release / unjail a quarantined member and restore their original roles")
        .addUserOption((opt) => opt.setName("target").setDescription("Member to unjail").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for release")),
    )
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("Automatically configure Jail role, category, and quarantine channels"),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all currently quarantined / jailed members"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("info")
        .setDescription("View active jail session status for a member")
        .addUserOption((opt) => opt.setName("target").setDescription("Member").setRequired(true)),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) return;
    const sub = interaction.options.getSubcommand();
    const moderator = interaction.member as GuildMember;

    const perm = await permissionGuard.canExecute(moderator, {
      module: "jail",
      command: "jail",
      action: sub,
      discordFallback: PermissionFlagsBits.ModerateMembers,
    });

    if (!perm.allowed) {
      await interaction.reply({ content: `❌ **Access Denied:** ${perm.reason}`, ephemeral: true });
      return;
    }

    if (sub === "setup") {
      await interaction.deferReply();
      const res = await jailService.setupJail(interaction.guild);
      await interaction.editReply({
        content: `✅ **Jail Quarantine System configured!**\n• Role: <@&${res.roleId}>\n• Channel: <#${res.channelId}>\n• Category: <#${res.categoryId}>`,
      });
    } else if (sub === "user") {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason", true);
      const minutes = interaction.options.getInteger("duration_minutes");
      const durationSeconds = minutes ? minutes * 60 : null;

      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) {
        await interaction.reply({ content: "❌ Member not found in server.", ephemeral: true });
        return;
      }

      const check = await permissionGuard.canModerateTarget(moderator, targetMember);
      if (!check.canModerate) {
        await interaction.reply({ content: `❌ ${check.reason}`, ephemeral: true });
        return;
      }

      await interaction.deferReply();
      const res = await jailService.jailMember(
        interaction.guild,
        targetMember,
        { id: moderator.id, tag: moderator.user.tag },
        reason,
        durationSeconds,
      );

      if (!res.success) {
        await interaction.editReply({ content: `❌ Jail failed: ${res.error}` });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Danger)
        .setTitle("🚨 Member Quarantined / Jailed")
        .setDescription(
          `**Target:** <@${targetUser.id}> (\`${targetUser.tag}\`)\n` +
          `**Moderator:** <@${moderator.id}>\n` +
          `**Case ID:** \`#${res.caseId}\`\n` +
          `**Reason:** ${reason}\n` +
          (durationSeconds ? `**Duration:** \`${minutes} minutes\`` : `**Duration:** Permanent`),
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else if (sub === "release") {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason") || "Manual staff release";

      await interaction.deferReply();
      const res = await jailService.unjailMember(
        interaction.guild,
        targetUser.id,
        { id: moderator.id, tag: moderator.user.tag },
        reason,
      );

      if (!res.success) {
        await interaction.editReply({ content: `❌ Unjail failed: ${res.error}` });
        return;
      }

      await interaction.editReply({
        content: `🔓 **Released <@${targetUser.id}> from quarantine!** Restored **${res.restoredRolesCount}** original roles.`,
      });
    } else if (sub === "list") {
      const activeJails = await listActiveJails(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Danger)
        .setTitle(`🔒 Active Jails • ${interaction.guild.name}`)
        .setDescription(
          activeJails.length === 0
            ? "*No members currently in quarantine.*"
            : activeJails
                .map(
                  (j, i) =>
                    `**${i + 1}.** <@${j.userId}> — *"${j.reason}"*\nCase: \`#${j.caseId}\` | Mod: <@${j.moderatorId}> | ${j.expiresAt ? `Expires <t:${Math.floor(j.expiresAt.getTime() / 1000)}:R>` : "Permanent"}`,
                )
                .join("\n\n"),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (sub === "info") {
      const targetUser = interaction.options.getUser("target", true);
      const session = await getActiveJailSession(interaction.guild.id, targetUser.id);

      if (!session) {
        await interaction.reply({ content: `ℹ️ <@${targetUser.id}> is not currently jailed.`, ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Danger)
        .setTitle(`🔒 Jail Session • ${targetUser.tag}`)
        .setDescription(
          `**User:** <@${session.userId}>\n` +
          `**Moderator:** <@${session.moderatorId}>\n` +
          `**Case ID:** \`#${session.caseId}\`\n` +
          `**Reason:** ${session.reason}\n` +
          `**Isolated Roles:** ${session.savedRoleIds.length}\n` +
          `**Jailed At:** <t:${Math.floor(session.createdAt.getTime() / 1000)}:f>\n` +
          (session.expiresAt ? `**Expires:** <t:${Math.floor(session.expiresAt.getTime() / 1000)}:R>` : `**Duration:** Permanent`),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    const sub = args[0]?.toLowerCase();
    const moderator = message.member;

    const perm = await permissionGuard.canExecute(moderator, {
      module: "jail",
      command: "jail",
      discordFallback: PermissionFlagsBits.ModerateMembers,
    });

    if (!perm.allowed) {
      await message.reply({ content: `❌ **Access Denied:** ${perm.reason}` });
      return;
    }

    if (sub === "setup") {
      const res = await jailService.setupJail(message.guild);
      await message.reply({ content: `✅ Jail Quarantine initialized! Channel: <#${res.channelId}>` });
    } else if (sub === "unjail" || sub === "release") {
      const targetUser = message.mentions.users.first() || (args[1] ? await message.client.users.fetch(args[1]).catch(() => null) : null);
      if (!targetUser) {
        await message.reply({ content: "❌ **Usage:** `>jail release <@user> [reason]`" });
        return;
      }
      const res = await jailService.unjailMember(
        message.guild,
        targetUser.id,
        { id: moderator.id, tag: moderator.user.tag },
        args.slice(2).join(" ") || "Manual unjail",
      );
      await message.reply({ content: res.success ? `🔓 Released <@${targetUser.id}> from quarantine!` : `❌ ${res.error}` });
    } else {
      const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
      if (!targetUser) {
        await message.reply({
          content: "🔒 **Jail Commands:**\n• `>jail <@user> <reason>`\n• `>jail release <@user>`\n• `>jail setup`\n• `>jail list`",
        });
        return;
      }
      const targetMember = await message.guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) {
        await message.reply({ content: "❌ Member not found." });
        return;
      }
      const reason = args.slice(1).join(" ") || "No reason provided.";
      const res = await jailService.jailMember(
        message.guild,
        targetMember,
        { id: moderator.id, tag: moderator.user.tag },
        reason,
      );
      await message.reply({
        content: res.success ? `🚨 **Quarantined <@${targetUser.id}>!** Case \`#${res.caseId}\`` : `❌ ${res.error}`,
      });
    }
  },
};
