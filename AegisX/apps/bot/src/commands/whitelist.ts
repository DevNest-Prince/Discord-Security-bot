import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType,
  type Message,
} from "discord.js";

import {
  getGuildConfig,
  setWhitelistedUser,
  removeWhitelistedUser,
  resetWhitelistedUsers,
} from "@aegisx/database";
import { deleteGuildConfigCache } from "@aegisx/redis";

export const whitelistCommand = {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Manage Anti-Nuke whitelisted users and bypass permissions")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Whitelist a user with specific or all bypass permissions")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to whitelist").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a user from the whitelist")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to unwhitelist").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all whitelisted users and their permissions"),
    )
    .addSubcommand((sub) =>
      sub.setName("reset").setDescription("Remove all whitelisted users"),
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
        content: "❌ **Access Denied**: Only the Server Owner or Extra-Owners can manage whitelist.",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add") {
      const targetUser = interaction.options.getUser("user", true);

      if (targetUser.id === guild.ownerId) {
        await interaction.reply({ content: "ℹ️ Server Owner is already permanently immune.", ephemeral: true });
        return;
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`wl_select_${targetUser.id}`)
        .setPlaceholder("Select bypass permissions...")
        .setMinValues(1)
        .setMaxValues(14)
        .addOptions([
          { label: "Ban Members", value: "ban", description: "Bypass anti-ban check" },
          { label: "Kick Members", value: "kick", description: "Bypass anti-kick check" },
          { label: "Prune Members", value: "prune", description: "Bypass anti-prune check" },
          { label: "Bot Add", value: "botadd", description: "Allow adding bots to server" },
          { label: "Server Update", value: "serverup", description: "Allow editing server settings" },
          { label: "Member Update", value: "memup", description: "Allow giving dangerous roles" },
          { label: "Channel Create", value: "chcr", description: "Allow creating channels" },
          { label: "Channel Delete", value: "chdl", description: "Allow deleting channels" },
          { label: "Channel Update", value: "chup", description: "Allow updating channels" },
          { label: "Role Create", value: "rlcr", description: "Allow creating roles" },
          { label: "Role Delete", value: "rldl", description: "Allow deleting roles" },
          { label: "Role Update", value: "rlup", description: "Allow updating roles" },
          { label: "Mention Everyone", value: "meneve", description: "Allow pinging @everyone/@here" },
          { label: "Manage Webhooks", value: "mngweb", description: "Allow creating webhooks" },
        ]);

      const allButton = new ButtonBuilder()
        .setCustomId(`wl_all_${targetUser.id}`)
        .setLabel("Grant All Permissions")
        .setStyle(ButtonStyle.Success);

      const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(allButton);

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Whitelist Configuration: ${targetUser.tag}`)
        .setColor(0x5865f2)
        .setDescription(
          `Select which Anti-Nuke security modules <@${targetUser.id}> is allowed to bypass, or click **Grant All Permissions**.`,
        )
        .setFooter({ text: "Selection expires in 60 seconds" });

      const response = await interaction.reply({
        embeds: [embed],
        components: [row1, row2],
        fetchReply: true,
      });

      const collector = response.createMessageComponentCollector({
        filter: (i) => i.user.id === authorId,
        time: 60_000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === `wl_all_${targetUser.id}`) {
          const allPerms = {
            ban: true,
            kick: true,
            prune: true,
            botadd: true,
            serverup: true,
            memup: true,
            chcr: true,
            chdl: true,
            chup: true,
            rlcr: true,
            rlup: true,
            rldl: true,
            meneve: true,
            mngweb: true,
            mngstemo: true,
          };
          await setWhitelistedUser(guild.id, targetUser.id, allPerms);
          await deleteGuildConfigCache(guild.id);

          await i.update({
            content: `✅ <@${targetUser.id}> has been granted **FULL Whitelist** protection for all modules!`,
            embeds: [],
            components: [],
          });
        } else if (i.isStringSelectMenu() && i.customId === `wl_select_${targetUser.id}`) {
          const perms: Record<string, boolean> = {};
          for (const val of i.values) {
            perms[val] = true;
          }

          await setWhitelistedUser(guild.id, targetUser.id, perms);
          await deleteGuildConfigCache(guild.id);

          await i.update({
            content: `✅ <@${targetUser.id}> has been whitelisted for: \`${i.values.join(", ")}\``,
            embeds: [],
            components: [],
          });
        }
      });
    } else if (subcommand === "remove") {
      const targetUser = interaction.options.getUser("user", true);
      await removeWhitelistedUser(guild.id, targetUser.id);
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        content: `✅ Removed <@${targetUser.id}> from the Anti-Nuke whitelist.`,
      });
    } else if (subcommand === "list") {
      const whitelistedUsers = config.security?.whitelistedUsers ?? {};
      const userIds = Object.keys(whitelistedUsers);

      if (userIds.length === 0) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Whitelisted Users — ${guild.name}`)
              .setColor(0x5865f2)
              .setDescription("ℹ️ No users are currently whitelisted on this server."),
          ],
        });
        return;
      }

      const lines = userIds.map((id) => {
        const p = whitelistedUsers[id];
        const activePerms = Object.keys(p ?? {}).filter((k) => (p as any)[k]);
        return `• <@${id}> (\`${id}\`): \`${activePerms.length > 0 ? activePerms.join(", ") : "None"}\``;
      });

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Whitelisted Users (${userIds.length}) — ${guild.name}`)
        .setColor(0x00ff00)
        .setDescription(lines.join("\n"))
        .setFooter({ text: "Use /whitelist add or /whitelist remove to modify" });

      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "reset") {
      await resetWhitelistedUsers(guild.id);
      await deleteGuildConfigCache(guild.id);

      await interaction.reply({
        content: `✅ Successfully removed all whitelisted users from **${guild.name}**.`,
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
      await message.reply("❌ **Access Denied**: Only Server Owner or Extra-Owners can manage whitelist.");
      return;
    }

    const sub = args[0]?.toLowerCase();
    const targetUser = message.mentions.users.first() || (args[1] ? await message.client.users.fetch(args[1]).catch(() => null) : null);

    if (sub === "add" && targetUser) {
      // Whitelist all permissions by default via prefix
      const allPerms = {
        ban: true, kick: true, prune: true, botadd: true,
        serverup: true, memup: true, chcr: true, chdl: true,
        chup: true, rlcr: true, rlup: true, rldl: true,
        meneve: true, mngweb: true, mngstemo: true,
      };
      await setWhitelistedUser(guild.id, targetUser.id, allPerms);
      await deleteGuildConfigCache(guild.id);
      await message.reply(`✅ **${targetUser.tag}** has been granted full Anti-Nuke whitelist bypass.`);
    } else if (sub === "remove" && targetUser) {
      await removeWhitelistedUser(guild.id, targetUser.id);
      await deleteGuildConfigCache(guild.id);
      await message.reply(`✅ **${targetUser.tag}** has been removed from the whitelist.`);
    } else if (sub === "reset") {
      await resetWhitelistedUsers(guild.id);
      await deleteGuildConfigCache(guild.id);
      await message.reply("✅ All whitelisted users cleared.");
    } else {
      const whitelistedUsers = (config.security?.whitelistedUsers as any) ?? {};
      const userIds = Object.keys(whitelistedUsers);

      if (userIds.length === 0) {
        await message.reply("ℹ️ No whitelisted users found. Use `>whitelist add @user`.");
        return;
      }

      const lines = userIds.map((id) => `• <@${id}> (\`${id}\`)`);
      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Whitelisted Users (${userIds.length}) — ${guild.name}`)
        .setColor(0x00ff00)
        .setDescription(lines.join("\n"));
      await message.reply({ embeds: [embed] });
    }
  },
};

