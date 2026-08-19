import { botClient } from '../client';
import { GuildConfigService } from '../services/GuildConfigService';
import { EmbedBuilder } from 'discord.js';

botClient.on('guildMemberAdd', async (member) => {
  const config = await GuildConfigService.getConfig(member.guild.id);
  if (!config.welcome?.enabled || !config.welcome.channelId) return;

  const channel = member.guild.channels.cache.get(config.welcome.channelId);
  if (channel && 'send' in channel) {
    const welcomeConfig = config.welcome;
    
    // Fallback message agar database mein message undefined ho
    const rawMessage = welcomeConfig.message || 'Welcome {user} to {server}! 🎉';
    const formattedMessage = rawMessage
      .replace(/{user}/g, member.toString())
      .replace(/{server}/g, member.guild.name);

    const embed = new EmbedBuilder()
      .setTitle('Welcome!')
      .setDescription(formattedMessage)
      .setThumbnail(member.user.displayAvatarURL({ size: 2048 }))
      .setColor((welcomeConfig.color || '#FF007F') as `#${string}`)
      .setTimestamp();
    
    await channel.send({ embeds: [embed] });
  }
});