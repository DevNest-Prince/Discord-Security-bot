import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  type Message,
  type Role,
} from "discord.js";

import { getGuildConfig, updateAntiNukeConfig } from "@aegisx/database";
import { deleteGuildConfigCache } from "@aegisx/redis";

export const antinukeCommand = {
  data: new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Configure AegisX Anti-Nuke defense system")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("enable").setDescription("Enable Anti-Nuke defense mode"),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable Anti-Nuke defense mode"),
    )
    .addSubcommand((sub) =>
      sub.setName("config").setDescription("View current Anti-Nuke configuration"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("action")
        .setDescription("Set the punishment action for Anti-Nuke triggers")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Punishment action")
            .setRequired(true)
            .addChoices(
              { name: "Ban Executor", value: "ban" },
              { name: "Kick Executor", value: "kick" },
              { name: "Strip Roles", value: "strip_roles" },
            ),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
      return;
    }

    const guild = interaction.guild;
    const authorId = interaction.user.id;

    // Check if user is Server Owner or Extra-Owner
    const config = await getGuildConfig(guild.id);
    const isOwner = guild.ownerId === authorId;
    const isExtraOwner = config.security?.extraOwners?.includes(authorId);

    if (!isOwner && !isExtraOwner) {
      await interaction.reply({
        content: "❌ **Access Denied**: Only the Server Owner or an assigned Extra-Owner can configure Anti-Nuke.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "enable") {
      if (config.security?.antiNuke?.enabled) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Security Settings for ${guild.name}`)
              .setColor(0x00ff00)
              .setDescription("✅ **Anti-Nuke is already enabled on this server.**\n\nTo disable, use `/antinuke disable`."),
          ],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      // Check bot permissions
      const me = guild.members.me;
      if (!me?.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.editReply({
          content: "❌ **Setup Failed**: Bot requires `Administrator` permission to enable Anti-Nuke protection.",
        });
        return;
      }

      // Create AegisX Supreme role if not present
      let supremeRole = guild.roles.cache.find((r) => r.name === "AegisX Supreme™");
      if (!supremeRole) {
        try {
          supremeRole = await guild.roles.create({
            name: "AegisX Supreme™",
            color: 0xff0000,
            permissions: [PermissionFlagsBits.Administrator],
            reason: "AegisX Security: High-priority protection role",
          });
          await me.roles.add(supremeRole);
        } catch {
          // Ignore role creation error if lacking position
        }
      }

      await updateAntiNukeConfig(guild.id, { enabled: true, action: "ban" });
      await deleteGuildConfigCache(guild.id);

      const modules = [
        "✅ **Anti Ban & Kick**",
        "✅ **Anti Bot Add**",
        "✅ **Anti Channel Create / Delete / Update**",
        "✅ **Anti Role Create / Delete / Update**",
        "✅ **Anti Member Update (Dangerous Perms)**",
        "✅ **Anti Guild Update (Vanity/Name/Icon)**",
        "✅ **Anti Webhook Create / Delete / Spam**",
        "✅ **Anti Everyone / Here Mention**",
        "✅ **Anti Prune & Integrations**",
        "✅ **Auto Recovery System**",
      ].join("\n");

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ AegisX Security Defense Activated`)
        .setColor(0x00ff00)
        .setDescription(
          `Anti-Nuke defense mode is now **ACTIVE** for **${guild.name}**.\n\n` +
          `**Active Protection Modules:**\n${modules}\n\n` +
          `*Tip: Ensure AegisX's highest role is at the top of your server role list for maximum enforcement speed.*`,
        )
        .setTimestamp()
        .setFooter({ text: "AegisX Security System", iconURL: guild.client.user?.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });
    } else if (subcommand === "disable") {
      if (!config.security?.antiNuke?.enabled) {
        await interaction.reply({
          content: "❌ Anti-Nuke is already disabled on this server. Use `/antinuke enable` to activate it.",
          ephemeral: true,
        });
        return;
      }

      await updateAntiNukeConfig(guild.id, { enabled: false });
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Security Settings for ${guild.name}`)
            .setColor(0xff0000)
            .setDescription("🔴 **Anti-Nuke protection has been disabled.**\n\nTo re-enable, use `/antinuke enable`."),
        ],
      });
    } else if (subcommand === "config") {
      const antiNuke = config.security?.antiNuke;
      const isEnabled = antiNuke?.enabled ?? false;

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Security Configuration — ${guild.name}`)
        .setColor(isEnabled ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "Status", value: isEnabled ? "🟢 **ENABLED**" : "🔴 **DISABLED**", inline: true },
          { name: "Punishment Action", value: `\`${antiNuke?.action?.toUpperCase() ?? "BAN"}\``, inline: true },
          { name: "Auto-Recovery", value: antiNuke?.recoveryEnabled !== false ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Whitelisted Users", value: `${Object.keys(config.security?.whitelistedUsers ?? {}).length} users`, inline: true },
          { name: "Extra Owners", value: `${config.security?.extraOwners?.length ?? 0} users`, inline: true },
          { name: "Log Channel", value: antiNuke?.logChannelId ? `<#${antiNuke.logChannelId}>` : "*Not set*", inline: true },
        )
        .setFooter({ text: "Use /whitelist and /extraowner to manage permissions" });

      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "action") {
      const actionType = interaction.options.getString("type", true) as "ban" | "kick" | "strip_roles";
      await updateAntiNukeConfig(guild.id, { action: actionType });
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        content: `✅ Anti-Nuke punishment action updated to **${actionType.toUpperCase()}**.`,
      });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    const guild = message.guild;
    const authorId = message.author.id;

    const config = await getGuildConfig(guild.id);
    const isOwner = guild.ownerId === authorId;
    const isExtraOwner = config.security?.extraOwners?.includes(authorId);

    if (!isOwner && !isExtraOwner) {
      await message.reply("❌ **Access Denied**: Only Server Owner or Extra-Owners can configure Anti-Nuke.");
      return;
    }

    const sub = args[0]?.toLowerCase();

    if (sub === "enable") {
      let supremeRole = guild.roles.cache.find((r: Role) => r.name === "AegisX Supreme™");
      if (!supremeRole) {

        try {
          supremeRole = await guild.roles.create({
            name: "AegisX Supreme™",
            color: 0xff0033,
            hoist: true,
            permissions: [PermissionFlagsBits.Administrator],
            reason: "AegisX Supreme Anti-Nuke Role",
          });
          const botMember = guild.members.me;
          if (botMember) await botMember.roles.add(supremeRole);
        } catch {
          // Continue
        }
      }

      await updateAntiNukeConfig(guild.id, { enabled: true, action: "ban", recoveryEnabled: true });
      await deleteGuildConfigCache(guild.id);

      const embed = new EmbedBuilder()
        .setTitle(`Security Settings for ${guild.name}`)
        .setColor(0x00ff00)
        .setDescription(
          `🛡️ **Anti-Nuke protection has been ENABLED!**\n\n` +
          `• Punishment Action: \`BAN\`\n` +
          `• Automated Disaster Recovery: \`ACTIVE\`\n` +
          `• Supreme Defense: \`ENABLED\`\n\n` +
          `*To whitelist trusted staff members, use \`>whitelist add @user\`.*`,
        );

      await message.reply({ embeds: [embed] });
    } else if (sub === "disable") {
      await updateAntiNukeConfig(guild.id, { enabled: false });
      await deleteGuildConfigCache(guild.id);
      await message.reply("🔴 **Anti-Nuke protection has been disabled.**");
    } else {
      const antiNuke = config.security?.antiNuke;
      const isEnabled = antiNuke?.enabled ?? false;

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Security Configuration — ${guild.name}`)
        .setColor(isEnabled ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: "Status", value: isEnabled ? "🟢 **ENABLED**" : "🔴 **DISABLED**", inline: true },
          { name: "Punishment Action", value: `\`${antiNuke?.action?.toUpperCase() ?? "BAN"}\``, inline: true },
          { name: "Auto-Recovery", value: antiNuke?.recoveryEnabled !== false ? "✅ Enabled" : "❌ Disabled", inline: true },
        )
        .setFooter({ text: "Use >antinuke enable / >antinuke disable to toggle" });

      await message.reply({ embeds: [embed] });
    }
  },
};

