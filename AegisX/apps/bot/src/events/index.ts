import type { Client } from "discord.js";

import { registerClientReadyEvent } from "./client-ready.js";
import { registerGuildCreateEvent } from "./guild-create.js";
import { handleGuildBanAdd } from "./guild-ban-add.js";
import { handleChannelDelete } from "./channel-delete.js";
import { handleChannelCreate } from "./channel-create.js";
import { handleRoleDelete } from "./role-delete.js";
import { handleRoleCreate } from "./role-create.js";
import { handleWebhookCreate } from "./webhook-create.js";
import { handleWebhookDelete } from "./webhook-delete.js";

export function registerEvents(
  client: Client,
): void {
  registerClientReadyEvent(client);
  registerGuildCreateEvent(client);

  client.on("guildBanAdd", (ban) => {
  void handleGuildBanAdd(
    ban.guild,
    ban.user.id,
  );
});
  client.on("channelDelete", (channel) => {
  if (!channel.isDMBased()) {
    void handleChannelDelete(channel);
  }
});

  client.on("channelCreate", (channel) => {
  if (!channel.isDMBased()) {
    void handleChannelCreate(channel);
  }
});

client.on("roleDelete", (role) => {
  void handleRoleDelete(role);
});

client.on("roleCreate", (role) => {
  void handleRoleCreate(role);
});

client.on("webhooksUpdate", (channel) => {
  // Webhook create/delete events are handled through
  // the webhook update event and resolved via audit logs.
});

}