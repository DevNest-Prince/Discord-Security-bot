import { REST, Routes } from "discord.js";
import {
  antinukeCommand,
  whitelistCommand,
  extraownerCommand,
  automodCommand,
} from "./index.js";

export async function registerSlashCommands(
  token: string,
  clientId: string,
  guildId?: string,
): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  const commandData = [
    antinukeCommand.data.toJSON(),
    whitelistCommand.data.toJSON(),
    extraownerCommand.data.toJSON(),
    automodCommand.data.toJSON(),
  ];

  try {
    console.log(`⏳ Registering ${commandData.length} application (/) commands...`);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandData,
      });
      console.log(`✅ Successfully registered application commands for guild ${guildId}!`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData,
      });
      console.log(`✅ Successfully registered global application commands!`);
    }
  } catch (error: any) {
    console.error("❌ Failed to register slash commands:", error?.message ?? error);
  }
}
