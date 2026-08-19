import { CommandInteraction, Message } from 'discord.js';
import { UtilityService } from '../services/UtilityService.js';
import { createSystemStatusEmbed } from '../../../ui/embeds/builders.js';
import { logger } from '../../../core/logger.js';

/**
 * Production Ping Command
 * Displays bot latency, WebSocket latency, and database/cache health
 * Optimized for Discord's 3-second interaction response deadline
 */
export const PingCommand = {
  name: 'ping',
  description: 'Check bot, database, and Redis latency metrics',
  aliases: ['latency', 'status'],
  
  async execute(context: CommandInteraction | Message) {
    try {
      // Defer immediately for slash commands to stay within 3-second limit
      if ('deferReply' in context) {
        await context.deferReply({ ephemeral: false });
      }

      const client = context.client;
      const wsLatency = client.ws.ping;

      // Fetch service health data
      const { dbStatus, redisStatus } = await UtilityService.getSystemPing(client);

      // Build the modern system status embed
      const embed = createSystemStatusEmbed(wsLatency, dbStatus, redisStatus);

      // Send the response
      if ('editReply' in context) {
        await context.editReply({ embeds: [embed] });
      } else if ('reply' in context) {
        await context.reply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error({ err: error }, 'Error executing ping command');
      throw error;
    }
  }
};