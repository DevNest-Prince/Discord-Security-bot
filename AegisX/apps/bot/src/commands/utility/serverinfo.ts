import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  ChannelType,
} from "discord.js";

export const serverinfoCommand = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Display detailed server information & stats"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();

    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;

    const embed = new EmbedBuilder()
      .setTitle(`📊 Server Information — ${guild.name}`)
      .setColor(0x5865f2)
      .setThumbnail(guild.iconURL() || interaction.client.user.displayAvatarURL())
      .addFields(
        { name: "Owner", value: `<@${owner.id}> (\`${owner.user.tag}\`)`, inline: true },
        { name: "Server ID", value: `\`${guild.id}\``, inline: true },
        { name: "Created On", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Members", value: `👥 Total: **${guild.memberCount}**`, inline: true },
        { name: "Roles", value: `🎭 **${guild.roles.cache.size}** roles`, inline: true },
        { name: "Boost Level", value: `🚀 Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
        { name: "Channels", value: `💬 Text: **${textChannels}** | 🔊 Voice: **${voiceChannels}** | 📁 Categories: **${categories}**`, inline: false },
      )
      .setFooter({ text: "AegisX Analytics", iconURL: interaction.client.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
  },

  async executePrefix(message: Message): Promise<void> {
    if (!message.guild) return;
    const guild = message.guild;
    const owner = await guild.fetchOwner();

    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;

    const embed = new EmbedBuilder()
      .setTitle(`📊 Server Information — ${guild.name}`)
      .setColor(0x5865f2)
      .setThumbnail(guild.iconURL() || message.client.user.displayAvatarURL())
      .addFields(
        { name: "Owner", value: `<@${owner.id}> (\`${owner.user.tag}\`)`, inline: true },
        { name: "Server ID", value: `\`${guild.id}\``, inline: true },
        { name: "Created On", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Members", value: `👥 Total: **${guild.memberCount}**`, inline: true },
        { name: "Roles", value: `🎭 **${guild.roles.cache.size}** roles`, inline: true },
        { name: "Boost Level", value: `🚀 Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
        { name: "Channels", value: `💬 Text: **${textChannels}** | 🔊 Voice: **${voiceChannels}** | 📁 Categories: **${categories}**`, inline: false },
      );

    await message.reply({ embeds: [embed] });
  },
};
