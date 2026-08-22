import type { Guild, GuildMember } from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { enforcementService } from "../enforcement/enforcement.service.js";

export interface LimitCheckResult {
  allowed: boolean;
  count: number;
  max: number;
  reason?: string;
}

export class LimitsService {
  private readonly actionTimestamps = new Map<string, number[]>();

  /**
   * Evaluates if an action by a member exceeds the configured rate limit.
   */
  async checkAndRecord(
    guild: Guild,
    member: GuildMember,
    actionType: string,
  ): Promise<LimitCheckResult> {
    // Primary owner is immune to limits
    if (member.id === guild.ownerId) {
      return { allowed: true, count: 0, max: 0 };
    }

    const config = await getGuildConfig(guild.id);
    const limitsConfig = config.limits;

    if (!limitsConfig || !limitsConfig.enabled) {
      return { allowed: true, count: 0, max: 0 };
    }

    const rule = (limitsConfig.limits as any)?.[actionType];
    if (!rule || !rule.count || rule.count <= 0) {
      return { allowed: true, count: 0, max: 0 };
    }

    const windowMs = (rule.windowSeconds || 60) * 1000;
    const key = `${guild.id}:${member.id}:${actionType}`;
    const now = Date.now();

    const timestamps = (this.actionTimestamps.get(key) ?? []).filter((t) => now - t <= windowMs);
    timestamps.push(now);
    this.actionTimestamps.set(key, timestamps);

    if (timestamps.length > rule.count) {
      // Exceeded limit: execute configured punishment
      const punishment = rule.action || "strip_roles";
      await enforcementService.execute({
        guild,
        executorId: member.id,
        action: punishment as any,
        reason: `Exceeded ${actionType} limit: ${timestamps.length}/${rule.count} in ${rule.windowSeconds}s`,
      });

      return {
        allowed: false,
        count: timestamps.length,
        max: rule.count,
        reason: `Action limit exceeded for ${actionType} (${timestamps.length}/${rule.count})`,
      };
    }

    return {
      allowed: true,
      count: timestamps.length,
      max: rule.count,
    };
  }
}

export const limitsService = new LimitsService();
