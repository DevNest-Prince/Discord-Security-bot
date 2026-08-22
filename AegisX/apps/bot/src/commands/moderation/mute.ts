import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";

function parseDuration(str?: string): number {
  if (!str) return 10 * 60 * 1000;
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match || !match[1] || !match[2]) return 10 * 60 * 1000;

  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s": return val * 1000;
    case "m": return val * 60 * 1000;
    case "h": return val * 60 * 60 * 1000;
    case "d": return val * 24 * 60 * 60 * 1000;
    default: return 10 * 60 * 1000;
  }
}


export const muteCommand = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout/mute a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName("target").setDescription("Member to mute").setRequired(true))
    .addStringOption((opt) => opt.setName("duration").setDescription("Duration (e.g. 10m, 1h, 1d)").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for mute")),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) return;
    const user = interaction.options.getUser("target", true);
    const durationStr = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member || !member.moderatable) {
      await interaction.reply({ content: "❌ I cannot timeout this member.", ephemeral: true });
      return;
    }

    const durationMs = parseDuration(durationStr);
    await member.timeout(durationMs, `${reason} | Moderator: ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setTitle("🔇 Member Timed Out")
      .setColor(0xff9900)
      .setDescription(`✅ **${user.tag}** has been timed out for **${durationStr}**.\n**Reason**: ${reason}`);

    await interaction.reply({ embeds: [embed] });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("❌ You lack permission to mute members.");
      return;
    }

    const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    const durationStr = args[1] || "10m";
    const reason = args.slice(2).join(" ") || "No reason provided";

    if (!targetUser) {
      await message.reply("❌ Usage: `>mute <@user|id> <duration> [reason]` (e.g. `>mute @user 1h spamming`)");
      return;
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member || !member.moderatable) {
      await message.reply("❌ I cannot timeout this member due to role hierarchy.");
      return;
    }

    const durationMs = parseDuration(durationStr);
    await member.timeout(durationMs, `${reason} | Moderator: ${message.author.tag}`);
    await message.reply(`✅ **${targetUser.tag}** has been timed out for **${durationStr}**.`);
  },
};

export const unmuteCommand = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName("target").setDescription("Member to unmute").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("target", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member || !member.moderatable) {
      await interaction.reply({ content: "❌ I cannot modify timeout on this member.", ephemeral: true });
      return;
    }

    await member.timeout(null, `Unmuted by ${interaction.user.tag}`);
    await interaction.reply({ content: `✅ Successfully removed timeout from **${user.tag}**.` });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("❌ You lack permission to unmute members.");
      return;
    }

    const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      await message.reply("❌ Usage: `>unmute <@user|id>`");
      return;
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member || !member.moderatable) {
      await message.reply("❌ Cannot modify timeout on this member.");
      return;
    }

    await member.timeout(null, `Unmuted by ${message.author.tag}`);
    await message.reply(`✅ Successfully removed timeout from **${targetUser.tag}**.`);
  },
};
