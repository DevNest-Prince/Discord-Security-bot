import type { Client } from "discord.js";

import { registerClientReadyEvent } from "./client-ready.js";
import { registerGuildCreateEvent } from "./guild-create.js";

export function registerEvents(client: Client): void {
  registerClientReadyEvent(client);
  registerGuildCreateEvent(client);
}