import { Message, EmbedBuilder, ChannelType } from 'discord.js';
import { GuildConfigService } from '../services/GuildConfigService';

export async function handleGreetCommand(message: Message, args: string[]) {
  if (!message.guild || !message.member?.permissions.has('ManageGuild')) return;

  const subCommand = args[0]?.toLowerCase();
  const config = await GuildConfigService.getConfig(message.guild.id);

  if (subCommand === 'channel') {
    const channel = message.mentions.channels.first();
    if (!channel || channel.type !== ChannelType.GuildText) {
      return message.reply('❌ Please mention a valid text channel.');
    }
    await GuildConfigService.updateConfig(message.guild.id, { 
      welcome: { ...config.welcome, channelId: channel.id, enabled: true } 
    });
    return message.reply(`✅ Welcome channel set to ${channel}`);
  }

  if (subCommand === 'test') {
    if (!config.welcome?.channelId) return message.reply('❌ Greet channel is not set!');
    const channel = message.guild.channels.cache.get(config.welcome.channelId);
    if (!channel || !('send' in channel)) return;

    const embed = new EmbedBuilder()
      .setTitle('Welcome Test')
      .setDescription(`Hello ${message.author}, welcome to the server! 🎉`)
      .setColor('#FF007F');
    
    await channel.send({ embeds: [embed] });
    return message.reply('✅ Test welcome message sent!');
  }
}