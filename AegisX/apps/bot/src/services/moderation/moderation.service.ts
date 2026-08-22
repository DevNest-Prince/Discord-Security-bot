import {
  type Guild,
  type GuildMember,
  type TextChannel,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { caseService } from "./case.service.js";
import { permissionGuard } from "../permissions/permission-guard.service.js";
import { dispatchLog } from "../logging/audit-logger.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export class ModerationService {
  async ban(
    guild: Guild,
    targetMember: GuildMember | string,
    moderator: GuildMember,
    reason: string,
    deleteMessageDays = 0,
  ): Promise<{ success: boolean; caseId: number; error?: string }> {
    const targetId = typeof targetMember === "string" ? targetMember : targetMember.id;
    const targetTag = typeof targetMember === "string" ? targetId : targetMember.user.tag;

    // Hierarchy & Permission check
    if (typeof targetMember !== "string") {
      const check = await permissionGuard.canModerateTarget(moderator, targetMember);
      if (!check.canModerate) {
        return { success: false, caseId: 0, error: check.reason };
      }
    }

    try {
      await guild.members.ban(targetId, {
        reason: `[${moderator.user.tag}] ${reason}`,
        deleteMessageSeconds: deleteMessageDays * 86400,
      });

      const modCase = await caseService.recordCase(guild.id, {
        targetId,
        targetTag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "ban",
        reason,
        source: "command",
      });

      const logEmbed = new EmbedBuilder()
        .setColor(AegisColors.Danger)
        .setTitle("🔨 Member Banned")
        .setDescription(
          `**Target:** <@${targetId}> (\`${targetTag}\`)\n` +
          `**Moderator:** <@${moderator.id}>\n` +
          `**Case ID:** \`#${modCase.caseId}\`\n` +
          `**Reason:** ${reason}`,
        )
        .setTimestamp();
      await dispatchLog(guild, "moderation", logEmbed);

      return { success: true, caseId: modCase.caseId };
    } catch (err: any) {
      return { success: false, caseId: 0, error: err?.message };
    }
  }

  async unban(
    guild: Guild,
    userId: string,
    moderator: GuildMember,
    reason: string,
  ): Promise<{ success: boolean; caseId: number; error?: string }> {
    try {
      await guild.members.unban(userId, `[${moderator.user.tag}] ${reason}`);

      const modCase = await caseService.recordCase(guild.id, {
        targetId: userId,
        targetTag: userId,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "unban",
        reason,
        source: "command",
      });

      const logEmbed = new EmbedBuilder()
        .setColor(AegisColors.Success)
        .setTitle("🔓 Member Unbanned")
        .setDescription(
          `**Target:** <@${userId}>\n` +
          `**Moderator:** <@${moderator.id}>\n` +
          `**Case ID:** \`#${modCase.caseId}\`\n` +
          `**Reason:** ${reason}`,
        )
        .setTimestamp();
      await dispatchLog(guild, "moderation", logEmbed);

      return { success: true, caseId: modCase.caseId };
    } catch (err: any) {
      return { success: false, caseId: 0, error: err?.message };
    }
  }

  async kick(
    guild: Guild,
    target: GuildMember,
    moderator: GuildMember,
    reason: string,
  ): Promise<{ success: boolean; caseId: number; error?: string }> {
    const check = await permissionGuard.canModerateTarget(moderator, target);
    if (!check.canModerate) {
      return { success: false, caseId: 0, error: check.reason };
    }

    try {
      await target.kick(`[${moderator.user.tag}] ${reason}`);

      const modCase = await caseService.recordCase(guild.id, {
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "kick",
        reason,
        source: "command",
      });

      const logEmbed = new EmbedBuilder()
        .setColor(AegisColors.Warning)
        .setTitle("👢 Member Kicked")
        .setDescription(
          `**Target:** <@${target.id}> (\`${target.user.tag}\`)\n` +
          `**Moderator:** <@${moderator.id}>\n` +
          `**Case ID:** \`#${modCase.caseId}\`\n` +
          `**Reason:** ${reason}`,
        )
        .setTimestamp();
      await dispatchLog(guild, "moderation", logEmbed);

      return { success: true, caseId: modCase.caseId };
    } catch (err: any) {
      return { success: false, caseId: 0, error: err?.message };
    }
  }

  async timeout(
    guild: Guild,
    target: GuildMember,
    moderator: GuildMember,
    durationSeconds: number,
    reason: string,
  ): Promise<{ success: boolean; caseId: number; error?: string }> {
    const check = await permissionGuard.canModerateTarget(moderator, target);
    if (!check.canModerate) {
      return { success: false, caseId: 0, error: check.reason };
    }

    try {
      await target.timeout(durationSeconds * 1000, `[${moderator.user.tag}] ${reason}`);

      const modCase = await caseService.recordCase(guild.id, {
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "timeout",
        reason,
        durationSeconds,
        source: "command",
      });

      const logEmbed = new EmbedBuilder()
        .setColor(AegisColors.Warning)
        .setTitle("⏳ Member Timed Out")
        .setDescription(
          `**Target:** <@${target.id}> (\`${target.user.tag}\`)\n` +
          `**Moderator:** <@${moderator.id}>\n` +
          `**Duration:** \`${Math.round(durationSeconds / 60)} minutes\`\n` +
          `**Case ID:** \`#${modCase.caseId}\`\n` +
          `**Reason:** ${reason}`,
        )
        .setTimestamp();
      await dispatchLog(guild, "moderation", logEmbed);

      return { success: true, caseId: modCase.caseId };
    } catch (err: any) {
      return { success: false, caseId: 0, error: err?.message };
    }
  }

  async untimeout(
    guild: Guild,
    target: GuildMember,
    moderator: GuildMember,
    reason: string,
  ): Promise<{ success: boolean; caseId: number; error?: string }> {
    try {
      await target.timeout(null, `[${moderator.user.tag}] ${reason}`);

      const modCase = await caseService.recordCase(guild.id, {
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: moderator.id,
        moderatorTag: moderator.user.tag,
        action: "unmute",
        reason,
        source: "command",
      });

      const logEmbed = new EmbedBuilder()
        .setColor(AegisColors.Success)
        .setTitle("🔊 Member Timeout Removed")
        .setDescription(
          `**Target:** <@${target.id}> (\`${target.user.tag}\`)\n` +
          `**Moderator:** <@${moderator.id}>\n` +
          `**Case ID:** \`#${modCase.caseId}\`\n` +
          `**Reason:** ${reason}`,
        )
        .setTimestamp();
      await dispatchLog(guild, "moderation", logEmbed);

      return { success: true, caseId: modCase.caseId };
    } catch (err: any) {
      return { success: false, caseId: 0, error: err?.message };
    }
  }
}

export const moderationService = new ModerationService();
