import { CommandInteraction, Message } from 'discord.js';
import { createGuildInfoEmbed } from '../../../ui/embeds/builders.js';
import { logger } from '../../../core/logger.js';

/**
 * Production Server Info Command
 * Displays comprehensive guild statistics and information
 * Optimized for Discord's 3-second interaction response deadline
 */
export const ServerInfoCommand = {
  name: 'serverinfo',
  description: 'Display detailed information about the server',
  aliases: ['guildinfo', 'server', 'sinfo'],

  async execute(context: CommandInteraction | Message) {
    try {
      // Defer immediately for slash commands
      if ('deferReply' in context) {
        await context.deferReply({ ephemeral: false });
      }

      const guild = context.guild;
      if (!guild) {
        throw new Error('Command must be used in a guild');
      }

      // Fetch server owner details safely
      let ownerTag = 'Unknown Owner';
      try {
        const owner = await guild.fetchOwner().catch(() => null);
        if (owner) {
          ownerTag = owner.user.tag;
        }
      } catch (error) {
        logger.warn({ err: error, guildId: guild.id }, 'Failed to fetch guild owner');
      }

      // Build the guild info embed with all details
      const embed = createGuildInfoEmbed(
        guild.name,
        guild.id,
        `<@${guild.ownerId}>` || ownerTag,
        guild.memberCount || 0,
        guild.channels.cache.size,
        guild.roles.cache.size,
        new Date(guild.createdTimestamp),
        guild.iconURL({ size: 256 }) || undefined,
        guild.premiumTier,
        guild.premiumSubscriptionCount || 0
      );

      // Send the response
      if ('editReply' in context) {
        await context.editReply({ embeds: [embed] });
      } else if ('reply' in context) {
        await context.reply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error({ err: error }, 'Error executing serverinfo command');
      throw error;
    }
  }
};