import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type GuildMember,
  type Message,
} from "discord.js";
import { warnService } from "../../services/moderation/warn.service.js";
import { permissionGuard } from "../../services/permissions/permission-guard.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const warnCommand = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Advanced Warning System & Strike Escalation")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Issue a formal warning strike to a member")
        .addUserOption((opt) => opt.setName("target").setDescription("Member to warn").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for warning").setRequired(true))
        .addIntegerOption((opt) => opt.setName("points").setDescription("Strike points (default: 1)")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("View all active warning strikes for a member")
        .addUserOption((opt) => opt.setName("target").setDescription("Member").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("Clear all active warning strikes for a member")
        .addUserOption((opt) => opt.setName("target").setDescription("Member").setRequired(true)),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) return;
    const sub = interaction.options.getSubcommand();
    const moderator = interaction.member as GuildMember;

    const perm = await permissionGuard.canExecute(moderator, {
      module: "moderation",
      command: "warn",
      action: "warn",
      discordFallback: PermissionFlagsBits.ModerateMembers,
    });

    if (!perm.allowed) {
      await interaction.reply({
        content: `❌ **Access Denied:** ${perm.reason}`,
        ephemeral: true,
      });
      return;
    }

    const targetUser = interaction.options.getUser("target", true);
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      await interaction.reply({ content: "❌ Target member not found in server.", ephemeral: true });
      return;
    }

    if (sub === "add") {
      const reason = interaction.options.getString("reason", true);
      const points = interaction.options.getInteger("points") || 1;

      const check = await permissionGuard.canModerateTarget(moderator, targetMember);
      if (!check.canModerate) {
        await interaction.reply({ content: `❌ ${check.reason}`, ephemeral: true });
        return;
      }

      const res = await warnService.warnMember(
        interaction.guild,
        targetMember,
        { id: moderator.id, tag: moderator.user.tag },
        reason,
        points,
      );

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Warning)
        .setTitle("⚠️ Warning Issued")
        .setDescription(
          `**Target:** <@${targetUser.id}> (\`${targetUser.tag}\`)\n` +
          `**Moderator:** <@${moderator.id}>\n` +
          `**Reason:** ${reason}\n` +
          `**Points Added:** \`+${points}\`\n` +
          `**Total Active Points:** \`${res.activePoints}\`\n` +
          (res.escalationTriggered
            ? `\n🚨 **Automatic Escalation Triggered:** Applied \`${res.escalationTriggered.toUpperCase()}\``
            : ""),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (sub === "list") {
      const warns = await warnService.getWarnings(interaction.guild.id, targetUser.id);
      const points = await warnService.getPoints(interaction.guild.id, targetUser.id);

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Primary)
        .setTitle(`📜 Warning Strikes • ${targetUser.tag}`)
        .setDescription(
          `**Total Active Strike Points:** \`${points}\`\n\n` +
          (warns.length === 0
            ? "*No active warning strikes.*"
            : warns
                .map(
                  (w, i) =>
                    `**${i + 1}.** Case \`#${w.caseId}\` (+${w.points} pts) — *"${w.reason}"*\nIssued by <@${w.moderatorId}> on <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`,
                )
                .join("\n\n")),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (sub === "clear") {
      const cleared = await warnService.clearWarnings(interaction.guild.id, targetUser.id);
      await interaction.reply({
        content: `✅ Cleared **${cleared}** active warning strikes for <@${targetUser.id}>.`,
      });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    const sub = args[0]?.toLowerCase();
    const moderator = message.member;

    const perm = await permissionGuard.canExecute(moderator, {
      module: "moderation",
      command: "warn",
      action: "warn",
      discordFallback: PermissionFlagsBits.ModerateMembers,
    });

    if (!perm.allowed) {
      await message.reply({ content: `❌ **Access Denied:** ${perm.reason}` });
      return;
    }

    const targetUser = message.mentions.users.first() || (args[1] ? await message.client.users.fetch(args[1]).catch(() => null) : null);
    if (!targetUser) {
      await message.reply({
        content: "⚠️ **Usage:**\n• `>warn add <@user> <reason>`\n• `>warn list <@user>`\n• `>warn clear <@user>`",
      });
      return;
    }

    const targetMember = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      await message.reply({ content: "❌ Target member not in server." });
      return;
    }

    if (sub === "add" || !sub) {
      const reason = args.slice(2).join(" ") || "No reason provided.";
      const res = await warnService.warnMember(
        message.guild,
        targetMember,
        { id: moderator.id, tag: moderator.user.tag },
        reason,
        1,
      );
      await message.reply({
        content: `⚠️ Warned <@${targetUser.id}> for: **${reason}** (Active Points: \`${res.activePoints}\`)`,
      });
    } else if (sub === "list" || sub === "warnings") {
      const points = await warnService.getPoints(message.guild.id, targetUser.id);
      await message.reply({ content: `📊 <@${targetUser.id}> currently has **${points}** active warning strike points.` });
    } else if (sub === "clear") {
      const count = await warnService.clearWarnings(message.guild.id, targetUser.id);
      await message.reply({ content: `✅ Cleared **${count}** warning strikes for <@${targetUser.id}>.` });
    }
  },
};
