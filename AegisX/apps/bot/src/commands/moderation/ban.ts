import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";

export const banCommand = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) => opt.setName("target").setDescription("Member to ban").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the ban")),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) return;
    const user = interaction.options.getUser("target", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member && !member.bannable) {
      await interaction.reply({ content: "❌ I cannot ban this user (role hierarchy issue).", ephemeral: true });
      return;
    }

    await interaction.guild.bans.create(user.id, { reason: `${reason} | Moderator: ${interaction.user.tag}` });

    const embed = new EmbedBuilder()
      .setTitle("🔨 Member Banned")
      .setColor(0xff0000)
      .setDescription(`✅ Successfully banned **${user.tag}** (\`${user.id}\`)\n**Reason**: ${reason}`)
      .setFooter({ text: `Moderator: ${interaction.user.tag}` });

    await interaction.reply({ embeds: [embed] });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply("❌ You lack permission to ban members.");
      return;
    }

    const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      await message.reply("❌ Usage: `>ban <@user|id> [reason]`");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";
    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (member && !member.bannable) {
      await message.reply("❌ I cannot ban this member due to role hierarchy.");
      return;
    }

    await message.guild.bans.create(targetUser.id, { reason: `${reason} | Moderator: ${message.author.tag}` });
    await message.reply(`✅ Successfully banned **${targetUser.tag}** | Reason: ${reason}`);
  },
};

export const unbanCommand = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from the server by user ID")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((opt) => opt.setName("userid").setDescription("User ID to unban").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for unban")),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const userId = interaction.options.getString("userid", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    await interaction.guild.bans.remove(userId, `${reason} | Moderator: ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setTitle("🔓 User Unbanned")
      .setColor(0x00ff00)
      .setDescription(`✅ Successfully unbanned user ID \`${userId}\`\n**Reason**: ${reason}`);

    await interaction.reply({ embeds: [embed] });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply("❌ You lack permission to unban members.");
      return;
    }

    const userId = args[0];
    if (!userId) {
      await message.reply("❌ Usage: `>unban <userId> [reason]`");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";
    try {
      await message.guild.bans.remove(userId, `${reason} | Moderator: ${message.author.tag}`);
      await message.reply(`✅ Successfully unbanned user ID \`${userId}\`.`);
    } catch (err: any) {
      await message.reply(`❌ Failed to unban: ${err?.message}`);
    }
  },
};
