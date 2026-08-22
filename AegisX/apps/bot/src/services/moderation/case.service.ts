import {
  createModerationCase,
  getModerationCase,
  getUserModerationHistory,
  updateCaseReason,
  getGuildCaseCount,
  type ModerationCase,
} from "@aegisx/database";
import { EmbedBuilder, type Guild } from "discord.js";
import { AegisColors } from "../../utils/ui/colors.js";

export class CaseService {
  async recordCase(
    guildId: string,
    params: {
      targetId: string;
      targetTag: string;
      moderatorId: string;
      moderatorTag: string;
      action: ModerationCase["action"];
      reason: string;
      durationSeconds?: number | null;
      source?: ModerationCase["source"];
      metadata?: Record<string, unknown>;
    },
  ): Promise<ModerationCase> {
    const expiresAt =
      params.durationSeconds && params.durationSeconds > 0
        ? new Date(Date.now() + params.durationSeconds * 1000)
        : null;

    return createModerationCase({
      guildId,
      targetId: params.targetId,
      targetTag: params.targetTag,
      moderatorId: params.moderatorId,
      moderatorTag: params.moderatorTag,
      action: params.action,
      reason: params.reason || "No reason provided.",
      durationSeconds: params.durationSeconds,
      expiresAt,
      status: "active",
      source: params.source || "command",
      metadata: params.metadata || {},
    });
  }

  async getCase(guildId: string, caseId: number): Promise<ModerationCase | null> {
    return getModerationCase(guildId, caseId);
  }

  async getUserHistory(guildId: string, targetId: string, limit = 10): Promise<ModerationCase[]> {
    return getUserModerationHistory(guildId, targetId, limit);
  }

  async updateReason(
    guildId: string,
    caseId: number,
    reason: string,
    moderatorId?: string,
  ): Promise<ModerationCase | null> {
    return updateCaseReason(guildId, caseId, reason, moderatorId);
  }

  buildCaseEmbed(modCase: ModerationCase, guildName?: string): EmbedBuilder {
    const color =
      modCase.action === "ban" || modCase.action === "jail"
        ? AegisColors.Danger
        : modCase.action === "kick" || modCase.action === "warn"
          ? AegisColors.Warning
          : AegisColors.Primary;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`📋 Case #${modCase.caseId} | ${modCase.action.toUpperCase()}`)
      .setDescription(
        `**Target:** <@${modCase.targetId}> (\`${modCase.targetTag}\`)\n` +
        `**Moderator:** <@${modCase.moderatorId}> (\`${modCase.moderatorTag}\`)\n` +
        `**Action:** \`${modCase.action}\`\n` +
        `**Reason:** ${modCase.reason}\n` +
        (modCase.durationSeconds
          ? `**Duration:** \`${Math.round(modCase.durationSeconds / 60)} minutes\` (Expires: <t:${Math.floor(modCase.expiresAt!.getTime() / 1000)}:R>)\n`
          : "") +
        `**Source:** \`${modCase.source}\`\n` +
        `**Date:** <t:${Math.floor(modCase.createdAt.getTime() / 1000)}:F>`,
      )
      .setFooter({ text: guildName ? `AegisX Moderation • ${guildName}` : "AegisX Moderation" })
      .setTimestamp(modCase.createdAt);

    return embed;
  }
}

export const caseService = new CaseService();
