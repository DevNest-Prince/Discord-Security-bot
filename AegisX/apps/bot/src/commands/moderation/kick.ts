import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";

export const kickCommand = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) => opt.setName("target").setDescription("Member to kick").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for kick")),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) return;
    const user = interaction.options.getUser("target", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member || !member.kickable) {
      await interaction.reply({ content: "❌ I cannot kick this member (role hierarchy or missing permissions).", ephemeral: true });
      return;
    }

    await member.kick(`${reason} | Moderator: ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setTitle("👢 Member Kicked")
      .setColor(0xff9900)
      .setDescription(`✅ Successfully kicked **${user.tag}** (\`${user.id}\`)\n**Reason**: ${reason}`);

    await interaction.reply({ embeds: [embed] });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      await message.reply("❌ You lack permission to kick members.");
      return;
    }

    const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      await message.reply("❌ Usage: `>kick <@user|id> [reason]`");
      return;
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member || !member.kickable) {
      await message.reply("❌ I cannot kick this member due to role hierarchy.");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";
    await member.kick(`${reason} | Moderator: ${message.author.tag}`);
    await message.reply(`✅ Successfully kicked **${targetUser.tag}**.`);
  },
};
