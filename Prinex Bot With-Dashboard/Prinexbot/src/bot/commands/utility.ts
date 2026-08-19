import { Message, EmbedBuilder } from 'discord.js';

export async function handleUtilityCommands(message: Message, commandName: string, args: string[]) {
  if (!message.guild) return;

  // 1. Avatar Command (`p!avatar`)
  if (commandName === 'avatar' || commandName === 'pfp') {
    const targetUser = message.mentions.users.first() || message.author;
    const avatarURL = targetUser.displayAvatarURL({ size: 4096 });

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${targetUser.username}'s Avatar`)
      .setImage(avatarURL)
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    await message.reply({ embeds: [embed] });
    return;
  }

  // 2. Whois / User Info Command (`p!whois` or `p!userinfo`)
  if (commandName === 'whois' || commandName === 'userinfo') {
    const member = message.mentions.members?.first() || message.member;
    if (!member) return;

    const user = member.user;
    const roles = member.roles.cache
      .filter(role => role.id !== message.guild?.id)
      .sort((a, b) => b.position - a.position)
      .map(role => role.toString())
      .slice(0, 10); // Show top 10 roles max

    const embed = new EmbedBuilder()
      .setColor(member.displayHexColor || '#5865F2')
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL({ size: 2048 }))
      .addFields(
        { name: '👤 User', value: `${user} (\`${user.id}\`)`, inline: false },
        { name: '📅 Joined Server', value: `<t:${Math.floor((member.joinedTimestamp || Date.now()) / 1000)}:R>`, inline: true },
        { name: ' حساب Created Account', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: `🎭 Roles [${member.roles.cache.size - 1}]`, value: roles.length > 0 ? roles.join(', ') : 'None', inline: false }
      )
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    return;
  }
}