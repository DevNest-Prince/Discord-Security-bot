import type { Interaction } from "discord.js";
import {
  helpCommand,
  antinukeCommand,
  whitelistCommand,
  extraownerCommand,
  automodCommand,
  emergencyCommand,
  antibetrayCommand,
  limitCommand,
  banCommand,
  unbanCommand,
  kickCommand,
  muteCommand,
  unmuteCommand,
  lockCommand,
  unlockCommand,
  hideCommand,
  unhideCommand,
  nukeCommand,
  purgeCommand,
  vckickCommand,
  vcmuteCommand,
  vcunmuteCommand,
  pingCommand,
  serverinfoCommand,
  botinfoCommand,
} from "../commands/index.js";

const commands = new Map<string, any>([
  [helpCommand.data.name, helpCommand],
  [antinukeCommand.data.name, antinukeCommand],
  [whitelistCommand.data.name, whitelistCommand],
  [extraownerCommand.data.name, extraownerCommand],
  [automodCommand.data.name, automodCommand],
  [emergencyCommand.data.name, emergencyCommand],
  [antibetrayCommand.data.name, antibetrayCommand],
  [limitCommand.data.name, limitCommand],
  [banCommand.data.name, banCommand],
  [unbanCommand.data.name, unbanCommand],
  [kickCommand.data.name, kickCommand],
  [muteCommand.data.name, muteCommand],
  [unmuteCommand.data.name, unmuteCommand],
  [lockCommand.data.name, lockCommand],
  [unlockCommand.data.name, unlockCommand],
  [hideCommand.data.name, hideCommand],
  [unhideCommand.data.name, unhideCommand],
  [nukeCommand.data.name, nukeCommand],
  [purgeCommand.data.name, purgeCommand],
  [vckickCommand.data.name, vckickCommand],
  [vcmuteCommand.data.name, vcmuteCommand],
  [vcunmuteCommand.data.name, vcunmuteCommand],
  [pingCommand.data.name, pingCommand],
  [serverinfoCommand.data.name, serverinfoCommand],
  [botinfoCommand.data.name, botinfoCommand],
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
