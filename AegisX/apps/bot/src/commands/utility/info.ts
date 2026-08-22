import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  type Message,
  type GuildMember,
} from "discord.js";
import { utilityService } from "../../services/utility/utility.service.js";

export const infoCommand = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Server, User, Avatar, and Banner analytics")
    .addSubcommand((sub) =>
      sub.setName("server").setDescription("Display detailed server analytics and statistics"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("Display user profile and roles")
        .addUserOption((opt) => opt.setName("target").setDescription("User")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("avatar")
        .setDescription("View full resolution user avatar")
        .addUserOption((opt) => opt.setName("target").setDescription("User")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("banner")
        .setDescription("View user profile banner")
        .addUserOption((opt) => opt.setName("target").setDescription("User")),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser("target") || interaction.user;

    if (sub === "server") {
      await interaction.reply({ embeds: [utilityService.buildServerInfo(interaction.guild)] });
    } else if (sub === "user") {
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: "❌ User not in this server.", ephemeral: true });
        return;
      }
      await interaction.reply({ embeds: [utilityService.buildUserInfo(member)] });
    } else if (sub === "avatar") {
      await interaction.reply({ embeds: [utilityService.buildAvatarEmbed(user)] });
    } else if (sub === "banner") {
      const fetchedUser = await interaction.client.users.fetch(user.id, { force: true });
      await interaction.reply({ embeds: [utilityService.buildBannerEmbed(fetchedUser)] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild) return;
    const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : message.author) || message.author;
    const member = targetUser ? await message.guild.members.fetch(targetUser.id).catch(() => null) : null;

    if (member) {
      await message.reply({ embeds: [utilityService.buildUserInfo(member)] });
    } else {
      await message.reply({ embeds: [utilityService.buildServerInfo(message.guild)] });
    }
  },

};
