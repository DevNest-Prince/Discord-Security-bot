import type { Client } from "discord.js";
import { jailService } from "../services/jail/jail.service.js";
import { giveawayService } from "../services/giveaway/giveaway.service.js";

export function registerClientReadyEvent(client: Client): void {
  client.once("clientReady", (readyClient) => {
    console.log(`✅ ${readyClient.user.tag} is online and operational!`);

    // 1. Jail Expired Session Sweep Loop (Every 30 seconds)
    setInterval(() => {
      jailService.processExpiredJails(client).catch((err) => {
        console.error("⚠️ Failed to process expired jail sessions:", err);
      });
    }, 30 * 1000);

    // 2. Giveaway Due Sweep Loop (Every 10 seconds)
    setInterval(() => {
      giveawayService.processDueGiveaways(client).catch((err) => {
        console.error("⚠️ Failed to process due giveaways:", err);
      });
    }, 10 * 1000);
  });
}