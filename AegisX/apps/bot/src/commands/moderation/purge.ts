import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";

export const purgeCommand = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete messages from current channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("Number of messages (1-100)").setRequired(true).setMinValue(1).setMaxValue(100),
    )
    .addUserOption((opt) => opt.setName("user").setDescription("Filter messages by user")),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.channel || !("bulkDelete" in interaction.channel)) return;
    const amount = interaction.options.getInteger("amount", true);
    const filterUser = interaction.options.getUser("user");
    const channel = interaction.channel as TextChannel;

    let messages = await channel.messages.fetch({ limit: amount });
    if (filterUser) {
      messages = messages.filter((m) => m.author.id === filterUser.id);
    }

    const deleted = await channel.bulkDelete(messages, true);
    await interaction.reply({
      content: `🧹 Successfully deleted **${deleted.size}** messages${filterUser ? ` from <@${filterUser.id}>` : ""}.`,
      ephemeral: true,
    });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member || !message.channel || !("bulkDelete" in message.channel)) return;
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await message.reply("❌ You lack permission to manage messages.");
      return;
    }

    const count = parseInt(args[0] || "10", 10);
    if (isNaN(count) || count < 1 || count > 100) {
      await message.reply("❌ Usage: `>purge <1-100> [@user]`");
      return;
    }

    const filterUser = message.mentions.users.first();
    const channel = message.channel as TextChannel;

    // Delete the command message first
    await message.delete().catch(() => null);

    let messages = await channel.messages.fetch({ limit: count });
    if (filterUser) {
      messages = messages.filter((m) => m.author.id === filterUser.id);
    }

    const deleted = await channel.bulkDelete(messages, true);
    const notice = await channel.send(`🧹 Deleted **${deleted.size}** messages.`);
    setTimeout(() => notice.delete().catch(() => null), 5000);
  },
};
