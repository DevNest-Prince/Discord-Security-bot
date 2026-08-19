import { Message } from 'discord.js';
import { AfkService } from '../services/AfkService';

export async function handleAfkCommand(message: Message, args: string[]) {
  if (!message.guild || message.author.bot) return;

  const reason = args.join(' ') || 'Away from keyboard';
  await AfkService.setAfk(message.author.id, message.guild.id, reason);

  await message.reply(`💤 **${message.author.username}**, you are now AFK: **${reason}**`);
}