import type { Interaction } from "discord.js";
import {
  antinukeCommand,
  whitelistCommand,
  extraownerCommand,
  automodCommand,
} from "../commands/index.js";

const commands = new Map<string, any>([
  [antinukeCommand.data.name, antinukeCommand],
  [whitelistCommand.data.name, whitelistCommand],
  [extraownerCommand.data.name, extraownerCommand],
  [automodCommand.data.name, automodCommand],
]);

export async function handleInteractionCreate(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error: any) {
    console.error(`❌ Error executing command ${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "❌ There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
}
