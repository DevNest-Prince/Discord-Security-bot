import { Message } from 'discord.js';
import { botClient } from '../client';
import { GuildConfigService } from '../services/GuildConfigService';
import { handleWhitelistCommand } from '../commands/whitelist';
import { handleModerationCommands } from '../commands/moderation';
import { handleUtilityCommands } from '../commands/utility';
import { handleAfkCommand } from '../commands/afk';
import { AfkService } from '../services/AfkService';
import { handleGreetCommand } from '../commands/welcoming';
import { logger } from '../../utils/logger';

botClient.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.guild) return;

  // 1. Check if message author was AFK and remove AFK status
  const authorAfk = await AfkService.getAfk(message.author.id, message.guild.id);
  if (authorAfk) {
    await AfkService.removeAfk(message.author.id, message.guild.id);
    const welcomeBack = await message.reply(`👋 Welcome back, **${message.author.username}**! I've removed your AFK status.`);
    setTimeout(() => welcomeBack.delete().catch(() => {}), 4000);
  }

  // 2. Check if any mentioned user is AFK
  if (message.mentions.users.size > 0) {
    for (const [_, user] of message.mentions.users) {
      const mentionedAfk = await AfkService.getAfk(user.id, message.guild.id);
      if (mentionedAfk) {
        const timeAgo = Math.floor((Date.now() - mentionedAfk.timestamp) / 1000);
        await message.reply(`💤 **${user.username}** is currently AFK: **${mentionedAfk.reason}** (<t:${Math.floor(mentionedAfk.timestamp / 1000)}:R>)`);
      }
    }
  }

  const prefix = 'p!';

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    if (commandName === 'afk') {
      await handleAfkCommand(message, args);
    } else if (commandName === 'whitelist') {
      await handleWhitelistCommand(message, args);
    } else if (['ping', 'purge', 'clear', 'serverinfo'].includes(commandName)) {
      await handleModerationCommands(message, commandName, args);
    } else if (['avatar', 'pfp', 'whois', 'userinfo'].includes(commandName)) {
      await handleUtilityCommands(message, commandName, args);
    } else if (commandName === 'greet') {
      await handleGreetCommand(message, args); // <-- Yeh line add kar di hai!
    }
    return;
  }
});