import { CommandInteraction, Message } from 'discord.js';
import { createHelpCategoryEmbed, createBaseEmbed } from '../../../ui/embeds/builders.js';
import { Colors } from '../../../ui/colors.js';
import { Icons } from '../../../ui/icons.js';

export const HelpCommand = {
  name: 'help',
  description: 'List all available commands and their usage',
  aliases: ['commands', 'menu', 'h'],

  async execute(context: CommandInteraction | Message) {
    // Acknowledge command immediately (important for slash commands)
    const reply = 'reply' in context 
      ? await context.reply({ content: `${Icons.LOADING} Loading help menu...`, fetchReply: true }) 
      : null;

    // Define command categories
    const utilityCommands = [
      { name: 'ping', description: 'Check bot, database, and Redis latency metrics' },
      { name: 'serverinfo', description: 'Display detailed server statistics and information' },
      { name: 'userinfo', description: 'Get detailed profile info about a user' },
      { name: 'help', description: 'Display this help menu' }
    ];

    const securityCommands = [
      { name: 'whitelist', description: 'Manage server security whitelists for spam protection' }
    ];

    const upcomingCommands = [
      { name: 'anti-spam', description: 'Configure advanced spam detection (Coming Soon)' },
      { name: 'logging', description: 'Set up audit logging for moderation actions (Coming Soon)' },
      { name: 'anti-nuke', description: 'Protect server from mass deletions (Coming Soon)' }
    ];

    // Create main help embed
    const mainEmbed = createBaseEmbed()
      .setColor(Colors.BRAND)
      .setTitle(`${Icons.BOT} Prinex | Help Menu`)
      .setDescription('Welcome to Prinex Security Bot! Here are all available commands.\n\nUse `p!` for prefix commands or `/` for slash commands.')
      .addFields(
        {
          name: `${Icons.UTILITY} Utility Commands`,
          value: utilityCommands
            .map(cmd => `\`/${cmd.name}\` — ${cmd.description}`)
            .join('\n'),
          inline: false
        },
        {
          name: `${Icons.SECURITY} Security & Moderation`,
          value: securityCommands
            .map(cmd => `\`/${cmd.name}\` — ${cmd.description}`)
            .join('\n'),
          inline: false
        }
      )
      .setFooter({ 
        text: '💡 Tip: Use /help for detailed command information or visit our website for full documentation' 
      });

    // Create embeds for each category for detailed view
    const utilityEmbed = createHelpCategoryEmbed(
      'Utility',
      Icons.UTILITY,
      'General-purpose commands for bot and server information:',
      utilityCommands
    );

    const securityEmbed = createHelpCategoryEmbed(
      'Security & Whitelisting',
      Icons.SECURITY,
      'Commands for managing server security and anti-spam features:',
      securityCommands
    );

    const upcomingEmbed = createBaseEmbed()
      .setColor(Colors.WARNING)
      .setTitle(`${Icons.SECURITY} Coming Soon`)
      .setDescription('These features are currently in development:')
      .addFields(
        upcomingCommands.map(cmd => ({
          name: `⏳ ${cmd.name}`,
          value: cmd.description,
          inline: false
        }))
      )
      .setFooter({ text: 'Stay tuned for exciting new features!' });

    // Send response
    const embeds = [mainEmbed, utilityEmbed, securityEmbed, upcomingEmbed];

    if ('editReply' in context) {
      await context.editReply({ content: null, embeds: [mainEmbed] });
    } else if (reply) {
      await reply.edit({ content: null, embeds: [mainEmbed] });
    } else {
      await context.reply({ embeds: [mainEmbed] });
    }
  }
};