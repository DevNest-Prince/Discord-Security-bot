import { Interaction, Events } from 'discord.js';
import { PingCommand } from '../modules/utility/commands/ping.js';
import { ServerInfoCommand } from '../modules/utility/commands/serverinfo.js';
import { UserInfoCommand } from '../modules/utility/commands/userinfo.js';
import { HelpCommand } from '../modules/utility/commands/help.js';
import { WhitelistCommand } from '../commands/slash/whitelist.js';
import { logger } from '../core/logger.js';
import { createErrorEmbed } from '../ui/embeds/builders.js';

const commands = new Map();
commands.set(PingCommand.name, PingCommand);
commands.set(ServerInfoCommand.name, ServerInfoCommand);
commands.set(UserInfoCommand.name, UserInfoCommand);
commands.set(HelpCommand.name, HelpCommand);
commands.set(WhitelistCommand.name, WhitelistCommand);

/**
 * Slash Command Handler
 * Processes all Discord slash command interactions with proper error handling
 * Respects 3-second Discord interaction response deadline
 */
export const InteractionCreateEvent = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    
    if (!command) {
      logger.warn({ commandName: interaction.commandName }, 'No command matching the provided name was found.');
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error({ err: error, commandName: interaction.commandName }, `Error executing ${interaction.commandName}`);
      const errorEmbed = createErrorEmbed('There was an error while executing this command! Please try again or contact support.');
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};