import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  type Message,
  type GuildMember,
} from "discord.js";
import { vcBanService } from "../../services/voice/vcban.service.js";
import { permissionGuard } from "../../services/permissions/permission-guard.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export const vcBanCommand = {
  data: new SlashCommandBuilder()
    .setName("vcban")
    .setDescription("Enterprise Persistent Voice Channel Ban / Boycott Suite")
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Ban a user from joining any voice channels")
        .addUserOption((opt) => opt.setName("target").setDescription("Member to voice ban").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for voice ban")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("unban")
        .setDescription("Unban a user from voice channels")
        .addUserOption((opt) => opt.setName("target").setDescription("Member to voice unban").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason")),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all currently voice banned (boycotted) members"),
    )
    .addSubcommand((sub) =>
      sub.setName("reset").setDescription("Clear all voice bans for this server"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) return;
    const sub = interaction.options.getSubcommand();
    const moderator = interaction.member as GuildMember;

    const perm = await permissionGuard.canExecute(moderator, {
      module: "voice",
      command: "vcban",
      action: sub,
      discordFallback: PermissionFlagsBits.MuteMembers,
    });

    if (!perm.allowed) {
      await interaction.reply({ content: `❌ **Access Denied:** ${perm.reason}`, ephemeral: true });
      return;
    }

    if (sub === "user") {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason") || "Voice isolation / Boycott";

      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) {
        await interaction.reply({ content: "❌ Target member not in server.", ephemeral: true });
        return;
      }

      const check = await permissionGuard.canModerateTarget(moderator, targetMember);
      if (!check.canModerate) {
        await interaction.reply({ content: `❌ ${check.reason}`, ephemeral: true });
        return;
      }

      await interaction.deferReply();
      const res = await vcBanService.banMemberFromVoice(
        interaction.guild,
        targetMember,
        { id: moderator.id, tag: moderator.user.tag },
        reason,
      );

      if (!res.success) {
        await interaction.editReply({ content: `❌ Voice ban failed: ${res.error}` });
        return;
      }

      await interaction.editReply({
        content: `🚫 **Voice Banned <@${targetUser.id}>!** They are disconnected and blocked from joining voice channels.`,
      });
    } else if (sub === "unban") {
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason") || "Manual voice unban";

      await interaction.deferReply();
      const res = await vcBanService.unbanMemberFromVoice(
        interaction.guild,
        targetUser.id,
        { id: moderator.id, tag: moderator.user.tag },
        reason,
      );

      if (!res.success) {
        await interaction.editReply({ content: `❌ Voice unban failed: ${res.error}` });
      } else {
        await interaction.editReply({ content: `🔊 **Voice Unbanned <@${targetUser.id}>!**` });
      }
    } else if (sub === "list") {
      const bans = await vcBanService.getBans(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setColor(AegisColors.Danger)
        .setTitle(`🚫 Voice Banned Members • ${interaction.guild.name}`)
        .setDescription(
          bans.length === 0
            ? "*No members currently voice banned.*"
            : bans
                .map(
                  (b, i) =>
                    `**${i + 1}.** <@${b.userId}> — *"${b.reason}"*\nMod: <@${b.moderatorId}> | Date: <t:${Math.floor(b.createdAt.getTime() / 1000)}:R>`,
                )
                .join("\n\n"),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (sub === "reset") {
      const count = await vcBanService.clearBans(interaction.guild.id);
      await interaction.reply({ content: `✅ Cleared **${count}** voice bans.` });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    const sub = args[0]?.toLowerCase();
    const moderator = message.member;

    const perm = await permissionGuard.canExecute(moderator, {
      module: "voice",
      command: "vcban",
      discordFallback: PermissionFlagsBits.MuteMembers,
    });

    if (!perm.allowed) {
      await message.reply({ content: `❌ **Access Denied:** ${perm.reason}` });
      return;
    }

    if (sub === "unban") {
      const targetUser = message.mentions.users.first() || (args[1] ? await message.client.users.fetch(args[1]).catch(() => null) : null);
      if (!targetUser) {
        await message.reply({ content: "❌ **Usage:** `>vcban unban <@user>`" });
        return;
      }
      const res = await vcBanService.unbanMemberFromVoice(
        message.guild,
        targetUser.id,
        { id: moderator.id, tag: moderator.user.tag },
      );
      await message.reply({ content: res.success ? `🔊 Voice Unbanned <@${targetUser.id}>!` : `❌ ${res.error}` });
    } else if (sub === "list") {
      const bans = await vcBanService.getBans(message.guild.id);
      await message.reply({
        content: bans.length === 0 ? "ℹ️ No voice bans active." : `🚫 **Voice Bans (${bans.length}):**\n${bans.map((b) => `• <@${b.userId}>`).join(", ")}`,
      });
    } else {
      const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
      if (!targetUser) {
        await message.reply({
          content: "🚫 **Voice Ban (Boycott) Commands:**\n• `>vcban <@user> [reason]`\n• `>vcban unban <@user>`\n• `>vcban list`",
        });
        return;
      }
      const targetMember = await message.guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) {
        await message.reply({ content: "❌ Target member not in server." });
        return;
      }
      const reason = args.slice(1).join(" ") || "Voice ban / Boycott";
      const res = await vcBanService.banMemberFromVoice(
        message.guild,
        targetMember,
        { id: moderator.id, tag: moderator.user.tag },
        reason,
      );
      await message.reply({ content: res.success ? `🚫 **Voice Banned <@${targetUser.id}>!**` : `❌ ${res.error}` });
    }
  },
};
