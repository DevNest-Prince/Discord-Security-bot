import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  version as djsVersion,
} from "discord.js";
import os from "os";

export const botinfoCommand = {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Display bot technical statistics and runtime metrics"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const client = interaction.client;

    const embed = new EmbedBuilder()
      .setTitle("🤖 AegisX — System Statistics")
      .setColor(0x00ff00)
      .setThumbnail(client.user?.displayAvatarURL())
      .addFields(
        { name: "Bot Version", value: "`v2.0.0 Enterprise`", inline: true },
        { name: "Node.js", value: `\`${process.version}\``, inline: true },
        { name: "Discord.js", value: `\`v${djsVersion}\``, inline: true },
        { name: "Memory Usage", value: `\`${memUsed} MB\``, inline: true },
        { name: "Uptime", value: `\`${days}d ${hours}h ${minutes}m\``, inline: true },
        { name: "Platform", value: `\`${os.platform()} (${os.arch()})\``, inline: true },
        { name: "Servers Guarded", value: `🛡️ **${client.guilds.cache.size}** servers`, inline: true },
        { name: "Users Protected", value: `👥 **${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)}** members`, inline: true },
      )
      .setFooter({ text: "AegisX Core Defense", iconURL: client.user?.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
  },

  async executePrefix(message: Message): Promise<void> {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const client = message.client;

    const embed = new EmbedBuilder()
      .setTitle("🤖 AegisX — System Statistics")
      .setColor(0x00ff00)
      .setThumbnail(client.user?.displayAvatarURL())
      .addFields(
        { name: "Bot Version", value: "`v2.0.0 Enterprise`", inline: true },
        { name: "Node.js", value: `\`${process.version}\``, inline: true },
        { name: "Discord.js", value: `\`v${djsVersion}\``, inline: true },
        { name: "Memory Usage", value: `\`${memUsed} MB\``, inline: true },
        { name: "Uptime", value: `\`${days}d ${hours}h ${minutes}m\``, inline: true },
        { name: "Platform", value: `\`${os.platform()} (${os.arch()})\``, inline: true },
        { name: "Servers Guarded", value: `🛡️ **${client.guilds.cache.size}** servers`, inline: true },
        { name: "Users Protected", value: `👥 **${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)}** members`, inline: true },
      );

    await message.reply({ embeds: [embed] });
  },
};
