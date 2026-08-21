import type { Client } from "discord.js";

export function registerClientReadyEvent(client: Client): void {
  client.once("clientReady", (readyClient) => {
    console.log(`✅ ${readyClient.user.tag} is online!`);
  });
}