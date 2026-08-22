import {
  addWarning,
  getActiveWarnings,
  getActiveWarningPoints,
  clearUserWarnings,
  getGuildConfig,
  type WarnRecord,
} from "@aegisx/database";
import type { Guild, GuildMember } from "discord.js";
import { caseService } from "./case.service.js";

export class WarnService {
  async warnMember(
    guild: Guild,
    target: GuildMember,
    moderator: { id: string; tag: string },
    reason: string,
    points = 1,
  ): Promise<{ warnRecord: WarnRecord; activePoints: number; escalationTriggered?: string }> {
    const config = await getGuildConfig(guild.id);
    const expirationDays = config.warns?.expirationDays ?? 30;
    const expiresAt = new Date(Date.now() + expirationDays * 86400 * 1000);

    // 1. Create Moderation Case
    const modCase = await caseService.recordCase(guild.id, {
      targetId: target.id,
      targetTag: target.user.tag,
      moderatorId: moderator.id,
      moderatorTag: moderator.tag,
      action: "warn",
      reason,
      source: "command",
    });

    // 2. Add Warning Record
    const warnRecord = await addWarning({
      guildId: guild.id,
      userId: target.id,
      moderatorId: moderator.id,
      points,
      reason,
      active: true,
      expiresAt,
      caseId: modCase.caseId,
    });

    // 3. Calculate Total Active Points
    const activePoints = await getActiveWarningPoints(guild.id, target.id);

    // 4. Check for Escalation Rules
    let escalationTriggered: string | undefined;
    const escalationRules = config.warns?.escalationRules || [];
    const matchedRule = escalationRules
      .filter((r) => activePoints >= r.warnCount)
      .sort((a, b) => b.warnCount - a.warnCount)[0];

    if (matchedRule) {
      escalationTriggered = matchedRule.action;
      try {
        if (matchedRule.action === "timeout" || matchedRule.action === "mute") {
          const duration = (matchedRule.durationSeconds || 3600) * 1000;
          await target.timeout(duration, `[Auto-Escalation] Exceeded ${activePoints} warning strikes`);
        } else if (matchedRule.action === "jail") {
          const { jailService } = await import("../jail/jail.service.js");
          await jailService.jailMember(
            guild,
            target,
            { id: guild.client.user!.id, tag: "AegisX Auto-Escalation" },
            `Exceeded ${activePoints} warning strikes`,
            matchedRule.durationSeconds || 86400,
          );
        } else if (matchedRule.action === "kick") {
          await target.kick(`[Auto-Escalation] Exceeded ${activePoints} warning strikes`);
        } else if (matchedRule.action === "ban") {
          await guild.members.ban(target.id, {
            reason: `[Auto-Escalation] Exceeded ${activePoints} warning strikes`,
          });
        }
      } catch (err) {
        console.error(`[WarnService] Escalation punishment failed for user ${target.id}:`, err);
      }
    }

    return { warnRecord, activePoints, escalationTriggered };
  }

  async getWarnings(guildId: string, userId: string): Promise<WarnRecord[]> {
    return getActiveWarnings(guildId, userId);
  }

  async getPoints(guildId: string, userId: string): Promise<number> {
    return getActiveWarningPoints(guildId, userId);
  }

  async clearWarnings(guildId: string, userId: string): Promise<number> {
    return clearUserWarnings(guildId, userId);
  }
}

export const warnService = new WarnService();
