import { Events, Message, PermissionsBitField } from 'discord.js';
import { GuildConfigService } from '../services/GuildConfigService.js';
import { AutoModService } from '../services/AutoModService.js';
import { PingCommand } from '../modules/utility/commands/ping.js';
import { ServerInfoCommand } from '../modules/utility/commands/serverinfo.js';
import { UserInfoCommand } from '../modules/utility/commands/userinfo.js';
import { HelpCommand } from '../modules/utility/commands/help.js';
import { WhitelistCommand } from '../modules/utility/commands/whitelist.js';
import { logger } from '../core/logger.js';
import { createErrorEmbed, createWarningEmbed } from '../ui/embeds/builders.js';

const commands = new Map();

// Register prefix commands
commands.set(PingCommand.name, PingCommand);
PingCommand.aliases.forEach(alias => commands.set(alias, PingCommand));

commands.set(ServerInfoCommand.name, ServerInfoCommand);
ServerInfoCommand.aliases.forEach(alias => commands.set(alias, ServerInfoCommand));

commands.set(UserInfoCommand.name, UserInfoCommand);
UserInfoCommand.aliases.forEach(alias => commands.set(alias, UserInfoCommand));

commands.set(HelpCommand.name, HelpCommand);
HelpCommand.aliases.forEach(alias => commands.set(alias, HelpCommand));

commands.set(WhitelistCommand.name, WhitelistCommand);
WhitelistCommand.aliases.forEach(alias => commands.set(alias, WhitelistCommand));

/**
 * Message Handler for Prefix Commands and AutoMod
 * Processes text-based commands and handles spam detection
 */
export const MessageCreateEvent = {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message) {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    try {
      const guildId = message.guild.id;
      const isAdmin = message.member?.permissions.has(PermissionsBitField.Flags.Administrator);

      // AUTOMOD: Check spam for non-admins
      if (!isAdmin) {
        try {
          const isSpam = await AutoModService.checkSpam(message);
          if (isSpam) {
            await message.delete().catch(() => null);
            const warningEmbed = createWarningEmbed(
              `${message.author}, please slow down! Stop spamming.`
            );
            // Check if channel has send method (is a text-based channel)
            if ('send' in message.channel) {
              await (message.channel as any).send({ embeds: [warningEmbed] })
                .then((m: any) => setTimeout(() => m.delete().catch(() => null), 3000))
                .catch((err: any) => logger.warn({ err }, 'Failed to send warning'));
            }
            return;
          }
        } catch (error) {
          logger.error({ err: error, guildId }, 'Error in spam check');
          // Continue anyway - fail open
        }
      }

      // PREFIX COMMAND HANDLER
      const prefix = await GuildConfigService.getPrefix(guildId);
      if (!message.content.startsWith(prefix)) return;

      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      const command = commands.get(commandName);
      if (!command) return; // Unknown command - silently ignore

      try {
        logger.debug({ guildId, userId: message.author.id, command: commandName }, 'Executing prefix command');
        await command.execute(message, args);
      } catch (error) {
        logger.error({ err: error, commandName, guildId }, `Error executing prefix command ${commandName}`);
        const errorEmbed = createErrorEmbed('There was an error while executing this command!');
        await message.reply({ embeds: [errorEmbed] }).catch(err =>
          logger.warn({ err }, 'Failed to send error message')
        );
      }
    } catch (error) {
      logger.error({ err: error }, 'Unexpected error in message handler');
      // Silently fail to avoid cascade errors
    }
  },
};