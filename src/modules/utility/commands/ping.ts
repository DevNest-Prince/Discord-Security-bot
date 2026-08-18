import { CommandInteraction, Message } from 'discord.js';
import { UtilityService } from '../services/UtilityService.js';
import { createInfoEmbed } from '../../../ui/embeds/builders.js';

export const PingCommand = {
  name: 'ping',
  description: 'Check bot, database, and Redis latency',
  aliases: ['latency'],
  
  async execute(context: CommandInteraction | Message) {
    const client = context.client;
    
    // Acknowledge the command quickly so it doesn't timeout
    const reply = 'reply' in context 
      ? await context.reply({ content: 'Pinging system...', fetchReply: true }) 
      : null;
      
    const botLatency = reply ? reply.createdTimestamp - context.createdTimestamp : 'Calculating...';

    // Fetch data from Service Layer
    const { wsLatency, dbStatus, redisStatus } = await UtilityService.getSystemPing(client);

    // Build the standardized UI Embed (Fixed the empty string here!)
    const embed = createInfoEmbed('System Operational', 'Here are the current latency statistics:')
      .addFields(
        { name: 'Bot Latency', value: `\`${botLatency}ms\``, inline: true },
        { name: 'WebSocket', value: `\`${wsLatency}ms\``, inline: true },
        { name: 'MongoDB', value: `\`${dbStatus}\``, inline: true },
        { name: 'Redis', value: `\`${redisStatus}\``, inline: true }
      );

    // Send the final embed
    if ('editReply' in context) {
      await context.editReply({ content: null, embeds: [embed] });
    } else if (reply) {
      await reply.edit({ content: null, embeds: [embed] });
    }
  }
};