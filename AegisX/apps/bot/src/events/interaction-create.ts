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
  autoroleCommand,
  welcomeCommand,
  verificationCommand,
  vanityrolesCommand,
  ticketsCommand,
  levelingCommand,
  loggingCommand,
  customrolesCommand,
  j2cCommand,
  autoreactCommand,
  joindmCommand,
  backupCommand,
} from "../commands/index.js";
import { handleVerificationInteraction } from "../services/management/verification.service.js";
import {
  handleTicketCreateInteraction,
  handleTicketButtonInteraction,
} from "../services/management/tickets.service.js";

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
  [autoroleCommand.data.name, autoroleCommand],
  [welcomeCommand.data.name, welcomeCommand],
  [verificationCommand.data.name, verificationCommand],
  [vanityrolesCommand.data.name, vanityrolesCommand],
  [ticketsCommand.data.name, ticketsCommand],
  [levelingCommand.data.name, levelingCommand],
  [loggingCommand.data.name, loggingCommand],
  [customrolesCommand.data.name, customrolesCommand],
  [j2cCommand.data.name, j2cCommand],
  [autoreactCommand.data.name, autoreactCommand],
  [joindmCommand.data.name, joindmCommand],
  [backupCommand.data.name, backupCommand],
]);

export async function handleInteractionCreate(
  interaction: Interaction,
): Promise<void> {
  // 1. Handle Verification Button
  if (interaction.isButton() && interaction.customId === "aegis_verify_btn") {
    await handleVerificationInteraction(interaction);
    return;
  }

  // 2. Handle Ticket Select Menu
  if (interaction.isStringSelectMenu() && interaction.customId === "aegis_ticket_create_select") {
    await handleTicketCreateInteraction(interaction);
    return;
  }

  // 3. Handle Ticket Control Buttons
  if (interaction.isButton() && interaction.customId.startsWith("aegis_ticket_")) {
    await handleTicketButtonInteraction(interaction);
    return;
  }

  // 4. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
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
}

