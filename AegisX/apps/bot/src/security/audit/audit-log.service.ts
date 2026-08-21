import {
  AuditLogEvent,
  type Guild,
  type GuildAuditLogsEntry,
} from "discord.js";

import {
  AuditLogRateLimiter,
  type AuditLogRateLimitOptions,
} from "./audit-log-rate-limiter.js";

export interface FindAuditLogOptions {
  eventName: string;
  action: AuditLogEvent;
  targetId?: string;
  maxAgeMs?: number;
  limit?: number;
  rateLimit?: AuditLogRateLimitOptions;
}

export interface AuditLogResult {
  entry: GuildAuditLogsEntry;
  executorId: string | null;
}

const DEFAULT_MAX_AGE_MS = 10_000;
const DEFAULT_LIMIT = 5;

export class AuditLogService {
  private readonly rateLimiter =
    new AuditLogRateLimiter();

  async findSecurityEntry(
    guild: Guild,
    options: FindAuditLogOptions,
  ): Promise<AuditLogResult | null> {
    if (
      !guild.members.me?.permissions.has(
        "ViewAuditLog",
      )
    ) {
      return null;
    }

    const canFetch =
      this.rateLimiter.canFetch(
        guild.id,
        options.eventName,
        options.rateLimit,
      );

    if (!canFetch) {
      return null;
    }

    try {
      const auditLogs =
        await guild.fetchAuditLogs({
          type: options.action,
          limit:
            options.limit ?? DEFAULT_LIMIT,
        });

      const maxAgeMs =
        options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;

      const now = Date.now();

      for (const entry of auditLogs.entries.values()) {
        const ageMs =
          now - entry.createdTimestamp;

        if (
          ageMs < 0 ||
          ageMs > maxAgeMs
        ) {
          continue;
        }

        if (
          options.targetId !== undefined &&
          entry.targetId !== options.targetId
        ) {
          continue;
        }

        return {
          entry,
          executorId: entry.executorId,
        };
      }

      return null;
    } catch (error) {
      console.error(
        `Failed to fetch security audit logs for guild ${guild.id}:`,
        error,
      );

      return null;
    }
  }
    async findRecentWebhookEntry(
    guild: Guild,
  ): Promise<AuditLogResult | null> {
    if (
      !guild.members.me?.permissions.has(
        "ViewAuditLog",
      )
    ) {
      return null;
    }

    try {
      const [created, deleted] = await Promise.all([
        guild.fetchAuditLogs({
          type: AuditLogEvent.WebhookCreate,
          limit: 5,
        }),
        guild.fetchAuditLogs({
          type: AuditLogEvent.WebhookDelete,
          limit: 5,
        }),
      ]);

      const entries = [
        ...created.entries.values(),
        ...deleted.entries.values(),
      ]
        .filter((entry) => {
          const ageMs =
            Date.now() - entry.createdTimestamp;

          return (
            ageMs >= 0 &&
            ageMs <= 10_000 &&
            entry.targetId !== null
          );
        })
        .sort(
          (a, b) =>
            b.createdTimestamp -
            a.createdTimestamp,
        );

      const entry = entries[0];

      if (!entry) {
        return null;
      }

      return {
        entry,
        executorId: entry.executorId,
      };
    } catch (error) {
      console.error(
        `Failed to fetch webhook audit logs for guild ${guild.id}:`,
        error,
      );

      return null;
    }
  }
  clearGuild(guildId: string): void {
    this.rateLimiter.clearGuild(guildId);
  }
}

export const auditLogService =
  new AuditLogService();