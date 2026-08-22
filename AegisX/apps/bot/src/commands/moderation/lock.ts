import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";

export const lockCommand = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock the current channel for @everyone")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.channel || !("permissionOverwrites" in interaction.channel)) return;
    const channel = interaction.channel as TextChannel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    }, { reason: `Locked by ${interaction.user.tag}` });

    await interaction.reply({ content: `🔒 **#${channel.name}** has been locked.` });
  },

  async executePrefix(message: Message): Promise<void> {
    if (!message.guild || !message.member || !message.channel || !("permissionOverwrites" in message.channel)) return;
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply("❌ You lack permission to manage channels.");
      return;
    }

    const channel = message.channel as TextChannel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false,
    }, { reason: `Locked by ${message.author.tag}` });

    await message.reply(`🔒 **#${channel.name}** has been locked.`);
  },
};

export const unlockCommand = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock the current channel for @everyone")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.channel || !("permissionOverwrites" in interaction.channel)) return;
    const channel = interaction.channel as TextChannel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    }, { reason: `Unlocked by ${interaction.user.tag}` });

    await interaction.reply({ content: `🔓 **#${channel.name}** has been unlocked.` });
  },

  async executePrefix(message: Message): Promise<void> {
    if (!message.guild || !message.member || !message.channel || !("permissionOverwrites" in message.channel)) return;
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply("❌ You lack permission to manage channels.");
      return;
    }

    const channel = message.channel as TextChannel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: null,
    }, { reason: `Unlocked by ${message.author.tag}` });

    await message.reply(`🔓 **#${channel.name}** has been unlocked.`);
  },
};

export const hideCommand = {
  data: new SlashCommandBuilder()
    .setName("hide")
    .setDescription("Hide the current channel from @everyone")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.channel || !("permissionOverwrites" in interaction.channel)) return;
    const channel = interaction.channel as TextChannel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      ViewChannel: false,
    }, { reason: `Hidden by ${interaction.user.tag}` });

    await interaction.reply({ content: `🙈 **#${channel.name}** is now hidden from @everyone.` });
  },

  async executePrefix(message: Message): Promise<void> {
    if (!message.guild || !message.member || !message.channel || !("permissionOverwrites" in message.channel)) return;
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply("❌ You lack permission to manage channels.");
      return;
    }

    const channel = message.channel as TextChannel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      ViewChannel: false,
    }, { reason: `Hidden by ${message.author.tag}` });

    await message.reply(`🙈 **#${channel.name}** is now hidden from @everyone.`);
  },
};

export const unhideCommand = {
  data: new SlashCommandBuilder()
    .setName("unhide")
    .setDescription("Unhide the current channel for @everyone")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.channel || !("permissionOverwrites" in interaction.channel)) return;
    const channel = interaction.channel as TextChannel;
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      ViewChannel: null,
    }, { reason: `Unhidden by ${interaction.user.tag}` });

    await interaction.reply({ content: `👁️ **#${channel.name}** is now visible.` });
  },

  async executePrefix(message: Message): Promise<void> {
    if (!message.guild || !message.member || !message.channel || !("permissionOverwrites" in message.channel)) return;
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply("❌ You lack permission to manage channels.");
      return;
    }

    const channel = message.channel as TextChannel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      ViewChannel: null,
    }, { reason: `Unhidden by ${message.author.tag}` });

    await message.reply(`👁️ **#${channel.name}** is now visible.`);
  },
};
