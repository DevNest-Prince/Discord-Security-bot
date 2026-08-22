import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  type VoiceChannel,
  type Message,
} from "discord.js";
import { voiceService, tempVoiceMap } from "../../services/management/voice.service.js";
import { updateJ2CConfig, getGuildConfig } from "@aegisx/database";

export const voiceCommand = {
  data: new SlashCommandBuilder()
    .setName("voice")
    .setDescription("Dynamic temporary Join-to-Create voice room controls")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Automatically configure Join-to-Create voice hub and category"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("lock")
        .setDescription("Lock your temporary voice channel to prevent other members from joining"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("unlock")
        .setDescription("Unlock your temporary voice channel"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("hide")
        .setDescription("Hide your temporary voice channel from server members"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("unhide")
        .setDescription("Unhide your temporary voice channel"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("limit")
        .setDescription("Set max user capacity for your voice room")
        .addIntegerOption((opt) => opt.setName("capacity").setDescription("Max users (0-99)").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("claim")
        .setDescription("Claim ownership of the temporary voice channel if the previous owner left"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) return;
    const sub = interaction.options.getSubcommand();
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (sub === "setup") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({ content: "❌ You need `Manage Channels` permission.", ephemeral: true });
        return;
      }

      await interaction.deferReply();

      // Create Voice Category
      const cat = await interaction.guild.channels.create({
        name: "🔊 TEMPORARY VOICE",
        type: ChannelType.GuildCategory,
      });

      // Create Hub Voice Channel
      const hub = await interaction.guild.channels.create({
        name: "➕ Join to Create",
        type: ChannelType.GuildVoice,
        parent: cat.id,
      });

      await updateJ2CConfig(interaction.guild.id, {
        enabled: true,
        hubChannelId: hub.id,
        categoryId: cat.id,
      });

      await interaction.editReply({
        content: `✅ **Voice Master setup complete!**\n• Hub: <#${hub.id}>\n• Category: <#${cat.id}>`,
      });
      return;
    }

    // Voice Room owner actions
    const currentChannel = member.voice.channel as VoiceChannel | null;
    if (!currentChannel) {
      await interaction.reply({ content: "❌ You must be inside a voice channel to use this command.", ephemeral: true });
      return;
    }

    const session = tempVoiceMap.get(currentChannel.id);

    if (sub === "claim") {
      if (!session) {
        await interaction.reply({ content: "❌ This is not a dynamic temporary voice room.", ephemeral: true });
        return;
      }
      const previousOwnerInRoom = currentChannel.members.has(session.ownerId);
      if (previousOwnerInRoom && session.ownerId !== member.id) {
        await interaction.reply({ content: "❌ The original room owner is still inside the channel.", ephemeral: true });
        return;
      }
      session.ownerId = member.id;
      tempVoiceMap.set(currentChannel.id, session);
      await interaction.reply({ content: `👑 <@${member.id}> is now the owner of this voice room!` });
      return;
    }

    if (!session || session.ownerId !== member.id) {
      await interaction.reply({ content: "❌ Only the temporary voice room owner can manage room settings.", ephemeral: true });
      return;
    }

    if (sub === "lock") {
      await currentChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
      await interaction.reply({ content: "🔒 **Voice channel locked!**" });
    } else if (sub === "unlock") {
      await currentChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: true });
      await interaction.reply({ content: "🔓 **Voice channel unlocked!**" });
    } else if (sub === "hide") {
      await currentChannel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
      await interaction.reply({ content: "👁️ **Voice channel hidden!**" });
    } else if (sub === "unhide") {
      await currentChannel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: true });
      await interaction.reply({ content: "👀 **Voice channel unhidden!**" });
    } else if (sub === "limit") {
      const limit = interaction.options.getInteger("capacity", true);
      await currentChannel.setUserLimit(limit);
      await interaction.reply({ content: `👥 **Capacity set to ${limit} users.**` });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "setup" && message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      const cat = await message.guild.channels.create({ name: "🔊 TEMPORARY VOICE", type: ChannelType.GuildCategory });
      const hub = await message.guild.channels.create({ name: "➕ Join to Create", type: ChannelType.GuildVoice, parent: cat.id });
      await updateJ2CConfig(message.guild.id, { enabled: true, hubChannelId: hub.id, categoryId: cat.id });
      await message.reply({ content: `✅ Voice system setup! Hub: <#${hub.id}>` });
    } else {
      await message.reply({
        content: "🔊 **Voice Controls:**\n• `>voice setup`\n• `/voice lock` | `/voice unlock` | `/voice limit <number>`",
      });
    }
  },
};
