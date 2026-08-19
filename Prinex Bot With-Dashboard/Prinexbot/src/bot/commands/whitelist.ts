import { Message, EmbedBuilder, ChannelType } from 'discord.js';
import { GuildConfigService } from '../services/GuildConfigService';

export async function handleGreetCommand(message: Message, args: string[]) {
  if (!message.guild || !message.member?.permissions.has('ManageGuild')) {
    await message.reply('❌ You need **Manage Server** permissions to configure welcoming.');
    return;
  }

  const subCommand = args[0]?.toLowerCase();
  const config = await GuildConfigService.getConfig(message.guild.id);
  const currentWelcome = config.welcome || { enabled: true, channelId: null, message: 'Welcome {user} to {server}! 🎉', color: '#FF007F' };

  if (subCommand === 'channel') {
    const channel = message.mentions.channels.first();
    if (!channel || channel.type !== ChannelType.GuildText) {
      await message.reply('❌ Please mention a valid text channel. Example: `p!greet channel #welcome`');
      return;
    }
    await GuildConfigService.updateConfig(message.guild.id, { 
      welcome: { ...currentWelcome, channelId: channel.id, enabled: true } 
    });
    await message.reply(`✅ Welcome channel set to ${channel}`);
    return;
  }

  if (subCommand === 'message') {
    const customText = args.slice(1).join(' ');
    if (!customText) {
      await message.reply('❌ Please provide a message. Example: `p!greet message Welcome {user} to {server}! Enjoy your stay.`');
      return;
    }
    await GuildConfigService.updateConfig(message.guild.id, { 
      welcome: { ...currentWelcome, message: customText } 
    });
    await message.reply(`✅ Custom welcome message updated successfully!`);
    return;
  }

  if (subCommand === 'color') {
    const hexColor = args[1];
    if (!hexColor || !/^#[0-9A-F]{6}$/i.test(hexColor)) {
      await message.reply('❌ Please provide a valid HEX color code. Example: `p!greet color #00FF00`');
      return;
    }
    await GuildConfigService.updateConfig(message.guild.id, { 
      welcome: { ...currentWelcome, color: hexColor } 
    });
    await message.reply(`✅ Welcome embed color updated to \`${hexColor}\`!`);
    return;
  }

  if (subCommand === 'test') {
    if (!currentWelcome.channelId) {
      await message.reply('❌ Greet channel is not set yet! Use `p!greet channel #channel` first.');
      return;
    }
    const channel = message.guild.channels.cache.get(currentWelcome.channelId);
    if (!channel || !('send' in channel)) return;

    // Replace placeholders with real values for testing
    const formattedMessage = currentWelcome.message
      .replace(/{user}/g, message.author.toString())
      .replace(/{server}/g, message.guild.name);

    const embed = new EmbedBuilder()
      .setTitle('Welcome to the Server!')
      .setDescription(formattedMessage)
      .setColor(currentWelcome.color as `#${string}`)
      .setThumbnail(message.author.displayAvatarURL());
    
    await channel.send({ embeds: [embed] });
    await message.reply('✅ Test welcome message sent to the configured channel!');
    return;
  }

  // Help info if command is incorrect
  await message.reply(
    '🛠️ **Welcoming Configuration Commands:**\n' +
    '• `p!greet channel #channel` - Set the welcome channel\n' +
    '• `p!greet message <text>` - Set custom message (Use `{user}` & `{server}`)\n' +
    '• `p!greet color <HEX>` - Set embed color (e.g. `#FF0000`)\n' +
    '• `p!greet test` - Test the welcome message'
  );
}