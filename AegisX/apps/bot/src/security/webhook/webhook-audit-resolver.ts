import {
  AuditLogEvent,
  type Guild,
} from "discord.js";

import {
  auditLogService,
} from "../audit/audit-log.service.js";

import {
  antiNukeService,
} from "../antinuke/anti-nuke.service.js";

const PROCESSED_ENTRY_TTL_MS = 10_000;

export class WebhookAuditResolver {
  private readonly processedEntries =
    new Map<string, number>();

  async resolve(
    guild: Guild,
  ): Promise<void> {
    const audit =
      await auditLogService.findRecentWebhookEntry(
        guild,
      );

    if (!audit?.entry.targetId) {
      return;
    }

    const entryId = audit.entry.id;
    const processedAt =
      this.processedEntries.get(entryId);

    if (
      processedAt !== undefined &&
      Date.now() - processedAt <
        PROCESSED_ENTRY_TTL_MS
    ) {
      return;
    }

    this.processedEntries.set(
      entryId,
      Date.now(),
    );

    if (
      audit.entry.action ===
      AuditLogEvent.WebhookCreate
    ) {
      await antiNukeService.handle(
        guild,
        {
          eventName: "webhookCreate",
          action: AuditLogEvent.WebhookCreate,
          targetId: audit.entry.targetId,
        },
      );

      return;
    }

    if (
      audit.entry.action ===
      AuditLogEvent.WebhookDelete
    ) {
      await antiNukeService.handle(
        guild,
        {
          eventName: "webhookDelete",
          action: AuditLogEvent.WebhookDelete,
          targetId: audit.entry.targetId,
        },
      );
    }
  }
}

export const webhookAuditResolver =
  new WebhookAuditResolver();