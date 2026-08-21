import type { Client, Webhook } from "discord.js";

import { AuditLogEvent } from "discord.js";

import {
  antiNukeService,
} from "../security/antinuke/anti-nuke.service.js";

export async function handleWebhookCreate(
  client: Client,
  webhook: Webhook,
): Promise<void> {
  const guild = client.guilds.cache.get(
    webhook.guildId,
  );

  if (!guild) {
    return;
  }

  try {
    await antiNukeService.handle(
      guild,
      {
        eventName: "webhookCreate",
        action: AuditLogEvent.WebhookCreate,
        targetId: webhook.id,
      },
    );
  } catch (error) {
    console.error(
      `Webhook create Anti-Nuke handler failed in guild ${guild.id}:`,
      error,
    );
  }
}