import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
} from "discord.js";

export const pingCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency and gateway WebSocket ping"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const wsPing = interaction.client.ws.ping;
    const sent = await interaction.reply({ content: "🏓 Pinging...", fetchReply: true });
    const roundTrip = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .setColor(0x00ff00)
      .addFields(
        { name: "WebSocket Ping", value: `\`${wsPing}ms\``, inline: true },
        { name: "Roundtrip Latency", value: `\`${roundTrip}ms\``, inline: true },
      )
      .setFooter({ text: "AegisX Performance", iconURL: interaction.client.user?.displayAvatarURL() });

    await interaction.editReply({ content: null, embeds: [embed] });
  },

  async executePrefix(message: Message): Promise<void> {
    const wsPing = message.client.ws.ping;
    const sent = await message.reply("🏓 Pinging...");
    const roundTrip = sent.createdTimestamp - message.createdTimestamp;

    const embed = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .setColor(0x00ff00)
      .addFields(
        { name: "WebSocket Ping", value: `\`${wsPing}ms\``, inline: true },
        { name: "Roundtrip Latency", value: `\`${roundTrip}ms\``, inline: true },
      );

    await sent.edit({ content: null, embeds: [embed] });
  },
};
