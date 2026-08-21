import type { Client } from "discord.js";

import { getGuildConfig } from "../services/guild-config.service.js";

export function registerGuildCreateEvent(client: Client): void {
  client.on("guildCreate", async (guild) => {
    try {
      const config = await getGuildConfig(guild.id);

      console.log(
        `🛡️ Guild configured: ${guild.name} (${guild.id})`,
      );

      console.log(
        `⚙️ Anti-Nuke: ${config.security?.antiNuke?.enabled ?? false}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to configure guild ${guild.id}:`,
        error,
      );
    }
  });
}