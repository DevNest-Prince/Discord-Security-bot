import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { emergencyService } from "../security/emergency/emergency.service.js";

export const emergencyCommand = {
  data: new SlashCommandBuilder()
    .setName("emergency")
    .setDescription("Quarantine server channels or restore normal operations")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("lockdown").setDescription("Quarantine the entire server (lock all channels)"),
    )
    .addSubcommand((sub) =>
      sub.setName("restore").setDescription("Restore all channels to original permissions"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({ content: "❌ Server only command.", ephemeral: true });
      return;
    }

    const guild = interaction.guild;
    const authorId = interaction.user.id;
    const config = await getGuildConfig(guild.id);

    const isOwner = guild.ownerId === authorId;
    const isExtraOwner = config.security?.extraOwners?.includes(authorId);

    if (!isOwner && !isExtraOwner) {
      await interaction.reply({
        content: "❌ **Access Denied**: Only the Server Owner or Extra-Owners can trigger Emergency Lockdown.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (subcommand === "lockdown") {
      const res = await emergencyService.lockdown(guild, `Emergency Lockdown triggered by ${interaction.user.tag}`);
      if (res.success) {
        const embed = new EmbedBuilder()
          .setTitle("🚨 Server Emergency Lockdown Activated")
          .setColor(0xff0000)
          .setDescription(
            `⚠️ **Server has been quarantined!**\n\n` +
            `• Locked **${res.count}** channels.\n` +
            `• \`@everyone\` message sending and voice connection disabled.\n` +
            `• Pre-emergency permissions snapshot saved.\n\n` +
            `*Use \`/emergency restore\` to restore all channels.*`,
          );

        await interaction.editReply({ embeds: [embed] });

      } else {
        await interaction.editReply({ content: `❌ Emergency lockdown failed: ${res.error}` });
      }
    } else if (subcommand === "restore") {
      const res = await emergencyService.unlockdown(guild, `Emergency Restore triggered by ${interaction.user.tag}`);
      if (res.success) {
        const embed = new EmbedBuilder()
          .setTitle("✅ Server Quarantine Lifted")
          .setColor(0x00ff00)
          .setDescription(`Successfully restored **${res.count}** channels to their pre-emergency state.`);

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({ content: `❌ Emergency restore failed: ${res.error}` });
      }
    }
  },

  async executePrefix(message: Message, args: string[], action: "lockdown" | "restore" = "lockdown"): Promise<void> {
    if (!message.guild || !message.member) return;
    const guild = message.guild;
    const authorId = message.author.id;
    const config = await getGuildConfig(guild.id);

    const isOwner = guild.ownerId === authorId;
    const isExtraOwner = config.security?.extraOwners?.includes(authorId);

    if (!isOwner && !isExtraOwner) {
      await message.reply("❌ **Access Denied**: Only Server Owner or Extra-Owners can execute emergency controls.");
      return;
    }

    const sub = args[0]?.toLowerCase() === "restore" || action === "restore" ? "restore" : "lockdown";

    if (sub === "lockdown") {
      const loading = await message.reply("⏳ *Activating server quarantine...*");
      const res = await emergencyService.lockdown(guild, `Emergency Lockdown triggered by ${message.author.tag}`);
      if (res.success) {
        const embed = new EmbedBuilder()
          .setTitle("🚨 Server Emergency Lockdown Activated")
          .setColor(0xff0000)
          .setDescription(
            `⚠️ **Server has been quarantined!**\n\n` +
            `• Locked **${res.count}** channels.\n` +
            `• \`@everyone\` message sending and voice connection disabled.\n\n` +
            `*Use \`>unemergency\` or \`>emergency restore\` to restore all channels.*`,
          );
        await loading.edit({ content: null, embeds: [embed] });
      } else {
        await loading.edit({ content: `❌ Emergency lockdown failed: ${res.error}` });
      }
    } else {
      const loading = await message.reply("⏳ *Restoring channel permissions...*");
      const res = await emergencyService.unlockdown(guild, `Emergency Restore triggered by ${message.author.tag}`);
      if (res.success) {
        const embed = new EmbedBuilder()
          .setTitle("✅ Server Quarantine Lifted")
          .setColor(0x00ff00)
          .setDescription(`Successfully restored **${res.count}** channels to their pre-emergency state.`);
        await loading.edit({ content: null, embeds: [embed] });
      } else {
        await loading.edit({ content: `❌ Emergency restore failed: ${res.error}` });
      }
    }
  },
};
