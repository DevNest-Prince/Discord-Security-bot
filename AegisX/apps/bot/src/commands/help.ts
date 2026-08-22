import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";

export interface HelpCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  commands: Array<{ name: string; description: string; usage: string }>;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "antinuke",
    name: "Antinuke Security",
    emoji: "🛡️",
    description: "Enterprise multi-module anti-nuke defense & disaster auto-recovery",
    commands: [
      { name: "antinuke enable", description: "Activate 24/7 Anti-Nuke defense mode", usage: "antinuke enable" },
      { name: "antinuke disable", description: "Deactivate Anti-Nuke defense mode", usage: "antinuke disable" },
      { name: "antinuke config", description: "View active protection modules & punishment", usage: "antinuke config" },
      { name: "antinuke action", description: "Set trigger punishment (ban/kick/strip_roles)", usage: "antinuke action <ban|kick|strip_roles>" },
      { name: "whitelist add", description: "Grant granular module bypasses to a user", usage: "whitelist add <@user>" },
      { name: "whitelist remove", description: "Revoke whitelist bypass from a user", usage: "whitelist remove <@user>" },
      { name: "whitelist list", description: "List all whitelisted server members", usage: "whitelist list" },
      { name: "whitelist reset", description: "Clear all whitelisted members", usage: "whitelist reset" },
      { name: "extraowner set", description: "Appoint trusted administrator as Extra Owner", usage: "extraowner set <@user>" },
      { name: "extraowner view", description: "View appointed Extra Owners", usage: "extraowner view" },
    ],
  },
  {
    id: "antibetray",
    name: "Anti Betray ⭐",
    emoji: "🔒",
    description: "Detects and freezes rogue admins/extra-owners attempting mass sabotage",
    commands: [
      { name: "antibetray enable", description: "Enable Anti-Betray internal staff monitoring", usage: "antibetray enable" },
      { name: "antibetray disable", description: "Disable Anti-Betray monitoring", usage: "antibetray disable" },
      { name: "antibetray config", description: "View Anti-Betray trigger thresholds", usage: "antibetray config" },
    ],
  },
  {
    id: "limits",
    name: "Limit System ⭐",
    emoji: "🎚️",
    description: "Configure per-action rate limits for bans, kicks, channels, and roles",
    commands: [
      { name: "limit set", description: "Set maximum actions allowed in a time window", usage: "limit set <action> <count> <seconds>" },
      { name: "limit view", description: "View active staff action rate limits", usage: "limit view" },
      { name: "limit reset", description: "Reset all action limits to default", usage: "limit reset" },
    ],
  },
  {
    id: "emergency",
    name: "Emergency & Lockdown",
    emoji: "❌",
    description: "Quarantine server by locking all channels and halting permissions",
    commands: [
      { name: "emergency", description: "Instantly quarantine all server channels", usage: "emergency" },
      { name: "unemergency", description: "Restore all channel permissions from snapshot", usage: "unemergency" },
      { name: "lockdown", description: "Lock current channel for @everyone", usage: "lockdown" },
      { name: "unlockdown", description: "Unlock current channel for @everyone", usage: "unlockdown" },
    ],
  },
  {
    id: "automod",
    name: "Automod",
    emoji: "🚨",
    description: "Intelligent real-time content filters with auto-timeout and kick/ban",
    commands: [
      { name: "automod enable", description: "Activate all AutoMod content filters", usage: "automod enable" },
      { name: "automod disable", description: "Disable AutoMod filtering", usage: "automod disable" },
      { name: "automod punishment", description: "Set rule action (Mute, Kick, Ban, Block)", usage: "automod punishment <event> <action>" },
      { name: "automod ignore", description: "Exempt channels or roles from AutoMod", usage: "automod ignore <channel|role>" },
      { name: "automod logging", description: "Set channel for AutoMod incident reports", usage: "automod logging <#channel>" },
      { name: "automod config", description: "View active AutoMod rules & punishments", usage: "automod config" },
    ],
  },
  {
    id: "moderation",
    name: "Moderation",
    emoji: "🛠️",
    description: "High-speed server moderation and utility tools",
    commands: [
      { name: "ban", description: "Ban a member from the server", usage: "ban <@user> [reason]" },
      { name: "unban", description: "Unban a user by ID", usage: "unban <userId> [reason]" },
      { name: "kick", description: "Kick a member from the server", usage: "kick <@user> [reason]" },
      { name: "mute / timeout", description: "Timeout a member for specified duration", usage: "mute <@user> <duration> [reason]" },
      { name: "unmute", description: "Remove timeout from a member", usage: "unmute <@user>" },
      { name: "lock / unlock", description: "Lock or unlock channel message sending", usage: "lock / unlock [#channel]" },
      { name: "hide / unhide", description: "Hide or unhide channel view permissions", usage: "hide / unhide [#channel]" },
      { name: "nuke", description: "Recreate channel with exact permissions & delete old", usage: "nuke" },
      { name: "purge / clear", description: "Bulk delete 1-100 messages", usage: "purge <amount> [@user]" },
    ],
  },
  {
    id: "voice",
    name: "Voice & VcBan",
    emoji: "🎙️",
    description: "Voice channel management and voice bans",
    commands: [
      { name: "vcban", description: "Ban user from connecting to voice channels", usage: "vcban <@user>" },
      { name: "vcunban", description: "Unban user from voice channels", usage: "vcunban <@user>" },
      { name: "vckick", description: "Disconnect user from active voice channel", usage: "vckick <@user>" },
      { name: "vcmute", description: "Server-mute user in voice", usage: "vcmute <@user>" },
      { name: "vcunmute", description: "Server-unmute user in voice", usage: "vcunmute <@user>" },
    ],
  },
  {
    id: "utility",
    name: "Utility",
    emoji: "🔨",
    description: "General server information and bot utility",
    commands: [
      { name: "help", description: "Interactive help menu with category selector", usage: "help [command/module]" },
      { name: "prefix", description: "View or change server command prefix", usage: "prefix [new_prefix]" },
      { name: "ping", description: "Check bot latency and gateway WebSocket ping", usage: "ping" },
      { name: "serverinfo", description: "Display detailed server analytics", usage: "serverinfo" },
      { name: "botinfo", description: "Display bot system statistics & memory", usage: "botinfo" },
    ],
  },
];

export function buildOverviewEmbed(prefix: string, botUser: any): EmbedBuilder {
  const totalCommands = HELP_CATEGORIES.reduce((acc, cat) => acc + cat.commands.length, 0);

  const modulesList = [
    "🛡️ : Antinuke Security",
    "🔒 : Anti Betray ⭐",
    "🎚️ : Limit System ⭐",
    "⚔️ : Auto Emergency ⭐",
    "❌ : Emergency (Lockdown)",
    "🛠️ : Moderation",
    "🔨 : Utility",
    "🚨 : Automod",
    "🎴 : Welcoming",
    "🎙️ : Voice / VcBan",
    "⚙️ : Admin / Mod Setup",
  ].join("\n");

  return new EmbedBuilder()
    .setAuthor({
      name: `${botUser?.username ?? "AegisX"} Help Menu`,
      iconURL: botUser?.displayAvatarURL(),
    })
    .setColor(0xff0033)
    .setDescription(
      `**Bot Overview:**\n` +
      `🖊️ : Server Prefix: \`${prefix}\`\n` +
      `🗃️ : Total Commands: **${totalCommands}** | Slash: **28**\n` +
      `🔗 : **[Invite AegisX](https://discord.com/oauth2/authorize?client_id=${botUser?.id}&permissions=8&scope=bot%20applications.commands)** • **[Dashboard](http://localhost:8000)** • **[Support](https://discord.gg/)**\n\n` +
      `**How do you use me?**\n` +
      `\`\`\`asciidoc\n` +
      `${prefix}help <command/module> for more info regarding that command/module!\n` +
      `Example: ${prefix}help antinuke\n` +
      `\`\`\`\n` +
      `**Main Modules:**\n` +
      `${modulesList}\n\n` +
      `*Use buttons to swap pages & menu to select help pages. Need help? Contact Support.*`,
    )
    .setFooter({
      text: `AegisX Defense System • Page 1/${HELP_CATEGORIES.length + 1}`,
      iconURL: botUser?.displayAvatarURL(),
    });
}

export function buildCategoryEmbed(category: HelpCategory, prefix: string, botUser: any, pageIndex: number): EmbedBuilder {
  const commandLines = category.commands
    .map((c) => `• \`${prefix}${c.usage}\`\n  *${c.description}*`)
    .join("\n\n");

  return new EmbedBuilder()
    .setAuthor({
      name: `${category.emoji} ${category.name} Commands`,
      iconURL: botUser?.displayAvatarURL(),
    })
    .setColor(0x5865f2)
    .setDescription(
      `*${category.description}*\n\n` +
      `**Available Commands:**\n\n` +
      `${commandLines}`,
    )
    .setFooter({
      text: `AegisX Defense System • Page ${pageIndex + 2}/${HELP_CATEGORIES.length + 1}`,
      iconURL: botUser?.displayAvatarURL(),
    });
}

export function buildHelpComponents(currentPage: number, maxPages: number) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("help_category_select")
    .setPlaceholder("Select a Module...")
    .addOptions([
      { label: "Overview / Home", value: "overview", emoji: "🏠", description: "Return to main module list" },
      ...HELP_CATEGORIES.map((c) => ({
        label: c.name,
        value: c.id,
        emoji: c.emoji,
        description: c.description.slice(0, 50),
      })),
    ]);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const btnFirst = new ButtonBuilder().setCustomId("help_first").setEmoji("⏪").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0);
  const btnPrev = new ButtonBuilder().setCustomId("help_prev").setEmoji("◀️").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === 0);
  const btnClose = new ButtonBuilder().setCustomId("help_close").setEmoji("❌").setStyle(ButtonStyle.Danger);
  const btnNext = new ButtonBuilder().setCustomId("help_next").setEmoji("▶️").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === maxPages - 1);
  const btnLast = new ButtonBuilder().setCustomId("help_last").setEmoji("⏩").setStyle(ButtonStyle.Secondary).setDisabled(currentPage === maxPages - 1);

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(btnFirst, btnPrev, btnClose, btnNext, btnLast);

  return [row1, row2];
}

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View the interactive AegisX help menu and commands")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("Specific command or module name"),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const config = await getGuildConfig(interaction.guild.id);
    const prefix = config.prefix || ">";
    const query = interaction.options.getString("query")?.toLowerCase();

    if (query) {
      const specificEmbed = findSpecificHelp(query, prefix, interaction.client.user);
      if (specificEmbed) {
        await interaction.reply({ embeds: [specificEmbed] });
        return;
      }
    }

    let currentPage = 0;
    const maxPages = HELP_CATEGORIES.length + 1;
    const botUser = interaction.client.user;

    const initialEmbed = buildOverviewEmbed(prefix, botUser);
    const components = buildHelpComponents(currentPage, maxPages);

    const response = await interaction.reply({
      embeds: [initialEmbed],
      components,
      fetchReply: true,
    });

    const collector = response.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 120_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "help_close") {
        await i.update({ components: [] });
        collector.stop();
        return;
      }

      if (i.isStringSelectMenu() && i.customId === "help_category_select") {
        const val = i.values[0];
        if (val === "overview") {
          currentPage = 0;
        } else {
          const catIndex = HELP_CATEGORIES.findIndex((c) => c.id === val);
          if (catIndex !== -1) currentPage = catIndex + 1;
        }
      } else if (i.customId === "help_first") {
        currentPage = 0;
      } else if (i.customId === "help_prev") {
        currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId === "help_next") {
        currentPage = Math.min(maxPages - 1, currentPage + 1);
      } else if (i.customId === "help_last") {
        currentPage = maxPages - 1;
      }

      const newEmbed = currentPage === 0
        ? buildOverviewEmbed(prefix, botUser)
        : buildCategoryEmbed(HELP_CATEGORIES[currentPage - 1]!, prefix, botUser, currentPage - 1);

      const newComponents = buildHelpComponents(currentPage, maxPages);

      await i.update({
        embeds: [newEmbed],
        components: newComponents,
      });
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {
        // Ignore if message deleted
      }
    });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild) return;
    const config = await getGuildConfig(message.guild.id);
    const prefix = config.prefix || ">";
    const query = args[0]?.toLowerCase();

    if (query) {
      const specificEmbed = findSpecificHelp(query, prefix, message.client.user);
      if (specificEmbed) {
        await message.reply({ embeds: [specificEmbed] });
        return;
      }
    }

    let currentPage = 0;
    const maxPages = HELP_CATEGORIES.length + 1;
    const botUser = message.client.user;

    const initialEmbed = buildOverviewEmbed(prefix, botUser);
    const components = buildHelpComponents(currentPage, maxPages);

    const helpMsg = await message.reply({
      embeds: [initialEmbed],
      components,
    });

    const collector = helpMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 120_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "help_close") {
        await i.update({ components: [] });
        collector.stop();
        return;
      }

      if (i.isStringSelectMenu() && i.customId === "help_category_select") {
        const val = i.values[0];
        if (val === "overview") {
          currentPage = 0;
        } else {
          const catIndex = HELP_CATEGORIES.findIndex((c) => c.id === val);
          if (catIndex !== -1) currentPage = catIndex + 1;
        }
      } else if (i.customId === "help_first") {
        currentPage = 0;
      } else if (i.customId === "help_prev") {
        currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId === "help_next") {
        currentPage = Math.min(maxPages - 1, currentPage + 1);
      } else if (i.customId === "help_last") {
        currentPage = maxPages - 1;
      }

      const newEmbed = currentPage === 0
        ? buildOverviewEmbed(prefix, botUser)
        : buildCategoryEmbed(HELP_CATEGORIES[currentPage - 1]!, prefix, botUser, currentPage - 1);

      const newComponents = buildHelpComponents(currentPage, maxPages);

      await i.update({
        embeds: [newEmbed],
        components: newComponents,
      });

    });

    collector.on("end", async () => {
      try {
        await helpMsg.edit({ components: [] });
      } catch {
        // Ignore if deleted
      }
    });
  },
};

function findSpecificHelp(query: string, prefix: string, botUser: any): EmbedBuilder | null {
  for (const cat of HELP_CATEGORIES) {
    if (cat.id === query || cat.name.toLowerCase().includes(query)) {
      return buildCategoryEmbed(cat, prefix, botUser, 0);
    }

    const cmd = cat.commands.find((c) => c.name.toLowerCase().startsWith(query));
    if (cmd) {
      return new EmbedBuilder()
        .setTitle(`Command Help: ${prefix}${cmd.name}`)
        .setColor(0x5865f2)
        .addFields(
          { name: "Description", value: cmd.description, inline: false },
          { name: "Usage", value: `\`${prefix}${cmd.usage}\``, inline: false },
          { name: "Module", value: `${cat.emoji} ${cat.name}`, inline: true },
        )
        .setFooter({ text: "AegisX Security Defense System", iconURL: botUser?.displayAvatarURL() });
    }
  }

  return null;
}
