import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";

export const vckickCommand = {
  data: new SlashCommandBuilder()
    .setName("vckick")
    .setDescription("Disconnect a member from voice channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
    .addUserOption((opt) => opt.setName("target").setDescription("Member to disconnect").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("target", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member || !member.voice.channel) {
      await interaction.reply({ content: "❌ That member is not in a voice channel.", ephemeral: true });
      return;
    }

    await member.voice.disconnect(`Disconnected by ${interaction.user.tag}`);
    await interaction.reply({ content: `✅ Disconnected **${user.tag}** from voice.` });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    if (!message.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
      await message.reply("❌ You lack permission to disconnect members from voice.");
      return;
    }

    const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      await message.reply("❌ Usage: `>vckick <@user>`");
      return;
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member || !member.voice.channel) {
      await message.reply("❌ User is not in a voice channel.");
      return;
    }

    await member.voice.disconnect(`Disconnected by ${message.author.tag}`);
    await message.reply(`✅ Disconnected **${targetUser.tag}** from voice.`);
  },
};

export const vcmuteCommand = {
  data: new SlashCommandBuilder()
    .setName("vcmute")
    .setDescription("Server-mute a member in voice")
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
    .addUserOption((opt) => opt.setName("target").setDescription("Member to mute").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("target", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member || !member.voice.channel) {
      await interaction.reply({ content: "❌ That member is not in a voice channel.", ephemeral: true });
      return;
    }

    await member.voice.setMute(true, `Muted by ${interaction.user.tag}`);
    await interaction.reply({ content: `🔇 Server-muted **${user.tag}** in voice.` });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
      await message.reply("❌ You lack permission to server-mute members in voice.");
      return;
    }

    const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      await message.reply("❌ Usage: `>vcmute <@user>`");
      return;
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member || !member.voice.channel) {
      await message.reply("❌ User is not in a voice channel.");
      return;
    }

    await member.voice.setMute(true, `Muted by ${message.author.tag}`);
    await message.reply(`🔇 Server-muted **${targetUser.tag}**.`);
  },
};

export const vcunmuteCommand = {
  data: new SlashCommandBuilder()
    .setName("vcunmute")
    .setDescription("Server-unmute a member in voice")
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
    .addUserOption((opt) => opt.setName("target").setDescription("Member to unmute").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("target", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member || !member.voice.channel) {
      await interaction.reply({ content: "❌ That member is not in a voice channel.", ephemeral: true });
      return;
    }

    await member.voice.setMute(false, `Unmuted by ${interaction.user.tag}`);
    await interaction.reply({ content: `🔊 Server-unmuted **${user.tag}** in voice.` });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
      await message.reply("❌ You lack permission to server-unmute members in voice.");
      return;
    }

    const targetUser = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      await message.reply("❌ Usage: `>vcunmute <@user>`");
      return;
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member || !member.voice.channel) {
      await message.reply("❌ User is not in a voice channel.");
      return;
    }

    await member.voice.setMute(false, `Unmuted by ${message.author.tag}`);
    await message.reply(`🔊 Server-unmuted **${targetUser.tag}**.`);
  },
};
