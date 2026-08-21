import type { Client } from "discord.js";

import { registerClientReadyEvent } from "./client-ready.js";
import { registerGuildCreateEvent } from "./guild-create.js";
import { handleGuildBanAdd } from "./guild-ban-add.js";

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
}