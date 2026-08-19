import { CommandInteraction, Message, ChatInputCommandInteraction } from 'discord.js';
import { createUserProfileEmbed } from '../../../ui/embeds/builders.js';
import { logger } from '../../../core/logger.js';

/**
 * Production User Info Command
 * Displays comprehensive user profile details with roles and timestamps
 * Optimized for Discord's 3-second interaction response deadline
 */
export const UserInfoCommand = {
  name: 'userinfo',
  description: 'Display detailed information about a user',
  aliases: ['whois', 'user', 'uinfo'],

  async execute(context: CommandInteraction | Message) {
    try {
      // Defer immediately for slash commands
      if ('deferReply' in context) {
        await context.deferReply({ ephemeral: false });
      }

      // Get target user
      let targetUser;
      if (context instanceof ChatInputCommandInteraction) {
        targetUser = context.options.getUser('user') || context.user;
      } else if (context instanceof Message) {
        targetUser = context.mentions.users.first() || context.author;
      } else {
        targetUser = (context as any).user;
      }

      const guild = context.guild;
      if (!guild) {
        throw new Error('Command must be used in a guild');
      }

      // Get member info
      const member = await guild.members.fetch(targetUser.id).catch(() => null);

      // Format roles
      let rolesFormatted: string[] = [];
      if (member?.roles.cache.size) {
        rolesFormatted = member.roles.cache
          .filter(role => role.id !== guild.roles.everyone.id) // Exclude @everyone
          .map(role => role.toString())
          .slice(0, 10); // Limit to 10 roles to avoid embed field length limits
      }

      // Build the user profile embed
      const embed = createUserProfileEmbed(
        targetUser,
        new Date(targetUser.createdTimestamp),
        member?.joinedAt || undefined,
        rolesFormatted.length > 0 ? rolesFormatted : undefined
      );

      // Add member-specific info if available
      if (member) {
        if (member.joinedAt) {
          const joinedTimestamp = Math.floor(member.joinedAt.getTime() / 1000);
          embed.spliceFields(4, 1, {
            name: '📥 Joined Server',
            value: `<t:${joinedTimestamp}:D> (<t:${joinedTimestamp}:R>)`,
            inline: true
          });
        }
      }

      // Send the response
      if ('editReply' in context) {
        await context.editReply({ embeds: [embed] });
      } else if ('reply' in context) {
        await context.reply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error({ err: error }, 'Error executing userinfo command');
      throw error;
    }
  }
};