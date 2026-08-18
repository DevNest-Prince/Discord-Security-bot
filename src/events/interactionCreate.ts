import { Interaction, Events } from 'discord.js';
import { PingCommand } from '../modules/utility/commands/ping.js';
import { logger } from '../core/logger.js';
import { createErrorEmbed } from '../ui/embeds/builders.js';

// Hamara chota sa router jo check karega konsi command aayi hai
const commands = new Map();
commands.set(PingCommand.name, PingCommand);

export const InteractionCreateEvent = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction: Interaction) {
    // Agar interaction slash command nahi hai, toh ignore karo
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    
    if (!command) {
      logger.warn(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      // Command execute karo!
      await command.execute(interaction);
    } catch (error) {
      logger.error({ err: error }, `Error executing ${interaction.commandName}`);
      
      const errorEmbed = createErrorEmbed('There was an error while executing this command!');
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};