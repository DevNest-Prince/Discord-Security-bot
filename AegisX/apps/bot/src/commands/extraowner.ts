import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  type Message,
} from "discord.js";

import {
  getGuildConfig,
  setExtraOwner,
  removeExtraOwner,
  resetExtraOwners,
} from "@aegisx/database";
import { deleteGuildConfigCache } from "@aegisx/redis";

export const extraownerCommand = {
  data: new SlashCommandBuilder()
    .setName("extraowner")
    .setDescription("Manage server extra-owners who have full security administrative access")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Designate a trusted user as Extra Owner")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to set as Extra Owner").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove an Extra Owner")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to remove").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("reset").setDescription("Reset all Extra Owners"),
    )
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("View current Extra Owners"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({ content: "❌ Server only command.", ephemeral: true });
      return;
    }

    const guild = interaction.guild;
    const authorId = interaction.user.id;

    // Only Server Owner can manage Extra Owners
    const isOwner = guild.ownerId === authorId;
    const envBotOwners = (process.env.OWNER_IDS ?? "").split(",").map((s) => s.trim());
    const isBotOwner = envBotOwners.includes(authorId);

    if (!isOwner && !isBotOwner) {
      await interaction.reply({
        content: "❌ **Access Denied**: Only the primary Server Owner can manage Extra Owners.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const config = await getGuildConfig(guild.id);

    if (subcommand === "set") {
      const targetUser = interaction.options.getUser("user", true);

      if (targetUser.bot) {
        await interaction.reply({ content: "❌ Cannot set a bot as Extra Owner.", ephemeral: true });
        return;
      }

      if (targetUser.id === guild.ownerId) {
        await interaction.reply({ content: "ℹ️ Server Owner is already the primary owner.", ephemeral: true });
        return;
      }

      const confirmBtn = new ButtonBuilder()
        .setCustomId(`eo_confirm_${targetUser.id}`)
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success);

      const cancelBtn = new ButtonBuilder()
        .setCustomId(`eo_cancel_${targetUser.id}`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, cancelBtn);

      const embed = new EmbedBuilder()
        .setTitle("⚠️ Confirm Extra Owner Designation")
        .setColor(0xffa500)
        .setDescription(
          `Are you sure you want to appoint <@${targetUser.id}> as an **Extra Owner**?\n\n` +
          `*Extra Owners hold authority to modify Anti-Nuke settings and whitelist members.*`,
        );

      const response = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });

      const collector = response.createMessageComponentCollector({
        filter: (i) => i.user.id === authorId,
        time: 30_000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === `eo_confirm_${targetUser.id}`) {
          await setExtraOwner(guild.id, targetUser.id);
          await deleteGuildConfigCache(guild.id);

          await i.update({
            content: `✅ Successfully appointed <@${targetUser.id}> as **Extra Owner**!`,
            embeds: [],
            components: [],
          });
        } else {
          await i.update({
            content: "❌ Action cancelled.",
            embeds: [],
            components: [],
          });
        }
      });
    } else if (subcommand === "remove") {
      const targetUser = interaction.options.getUser("user", true);
      await removeExtraOwner(guild.id, targetUser.id);
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        content: `✅ Removed <@${targetUser.id}> from Extra Owners.`,
      });
    } else if (subcommand === "view") {
      const extraOwners = config.security?.extraOwners ?? [];

      if (extraOwners.length === 0) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Extra Owners — ${guild.name}`)
              .setColor(0x5865f2)
              .setDescription("ℹ️ No Extra Owners are currently assigned for this server."),
          ],
        });
        return;
      }

      const lines = extraOwners.map((id) => `• <@${id}> (\`${id}\`)`).join("\n");
      const embed = new EmbedBuilder()
        .setTitle(`👑 Extra Owners — ${guild.name}`)
        .setColor(0x00ff00)
        .setDescription(lines);

      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "reset") {
      await resetExtraOwners(guild.id);
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        content: `✅ Successfully cleared all Extra Owners for **${guild.name}**.`,
      });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild || !message.member) return;
    const guild = message.guild;
    const isOwner = guild.ownerId === message.author.id;

    if (!isOwner) {
      await message.reply("❌ **Access Denied**: Only the primary Server Owner can manage Extra Owners.");
      return;
    }

    const sub = args[0]?.toLowerCase();
    const targetUser = message.mentions.users.first() || (args[1] ? await message.client.users.fetch(args[1]).catch(() => null) : null);
    const config = await getGuildConfig(guild.id);

    if (sub === "set" && targetUser) {
      await setExtraOwner(guild.id, targetUser.id);
      await deleteGuildConfigCache(guild.id);
      await message.reply(`✅ **${targetUser.tag}** has been appointed as an **Extra Owner**.`);
    } else if (sub === "remove" && targetUser) {
      await removeExtraOwner(guild.id, targetUser.id);
      await deleteGuildConfigCache(guild.id);
      await message.reply(`✅ **${targetUser.tag}** has been removed from Extra Owners.`);
    } else if (sub === "reset") {
      await resetExtraOwners(guild.id);
      await deleteGuildConfigCache(guild.id);
      await message.reply("✅ All Extra Owners cleared.");
    } else {
      const extraOwners = config.security?.extraOwners ?? [];
      if (extraOwners.length === 0) {
        await message.reply("ℹ️ No Extra Owners assigned. Use `>extraowner set @user`.");
        return;
      }

      const lines = extraOwners.map((id) => `• <@${id}> (\`${id}\`)`).join("\n");
      const embed = new EmbedBuilder()
        .setTitle(`👑 Extra Owners — ${guild.name}`)
        .setColor(0x00ff00)
        .setDescription(lines);
      await message.reply({ embeds: [embed] });
    }
  },
};

