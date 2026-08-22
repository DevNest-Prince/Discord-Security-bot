import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";

export const nukeCommand = {
  data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Recreates the channel with exact permissions and deletes the old one")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.channel || !("clone" in interaction.channel)) return;
    const channel = interaction.channel as TextChannel;

    await interaction.reply({ content: "💣 *Nuking channel...*" });

    const newChannel = await channel.clone({
      name: channel.name,
      reason: `Nuked by ${interaction.user.tag}`,
    });

    await channel.delete(`Nuked by ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setTitle("💥 Channel Nuked")
      .setColor(0xff0000)
      .setDescription(`This channel was nuked by <@${interaction.user.id}>.`)
      .setImage("https://media.giphy.com/media/oe33xf3B50fsc/giphy.gif");

    await newChannel.send({ embeds: [embed] });
  },

  async executePrefix(message: Message): Promise<void> {
    if (!message.guild || !message.member || !message.channel || !("clone" in message.channel)) return;
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply("❌ You lack permission to manage channels.");
      return;
    }

    const channel = message.channel as TextChannel;
    const newChannel = await channel.clone({
      name: channel.name,
      reason: `Nuked by ${message.author.tag}`,
    });

    await channel.delete(`Nuked by ${message.author.tag}`);

    const embed = new EmbedBuilder()
      .setTitle("💥 Channel Nuked")
      .setColor(0xff0000)
      .setDescription(`This channel was nuked by <@${message.author.id}>.`)
      .setImage("https://media.giphy.com/media/oe33xf3B50fsc/giphy.gif");

    await newChannel.send({ embeds: [embed] });
  },
};
