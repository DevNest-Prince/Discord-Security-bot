import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";
import { createSelectMenu } from "../../utils/ui/components.js";
import { sendPaginatedMenu, type PaginationPage } from "../../utils/ui/pagination.js";

export interface HelpCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  commands: Array<{ name: string; description: string; usage: string }>;
}

export const ALL_17_MODULES: HelpCategory[] = [
  {
    id: "antinuke",
    name: "Antinuke",
    emoji: "🛡️",
    description: "Enterprise multi-module anti-nuke defense & disaster auto-recovery",
    commands: [
      { name: "antinuke enable", description: "Activate 24/7 Anti-Nuke defense mode", usage: "antinuke enable" },
      { name: "antinuke disable", description: "Deactivate Anti-Nuke defense mode", usage: "antinuke disable" },
      { name: "antinuke config", description: "View active protection modules & punishments", usage: "antinuke config" },
      { name: "antinuke action", description: "Set trigger punishment (ban/kick/strip_roles)", usage: "antinuke action <ban|kick|strip_roles>" },
      { name: "whitelist add", description: "Grant granular module bypasses to a target", usage: "whitelist add <target_id> <user|role|channel> <module>" },
      { name: "whitelist remove", description: "Revoke whitelist bypass from a target", usage: "whitelist remove <target_id>" },
      { name: "whitelist list", description: "List all whitelisted targets", usage: "whitelist list" },
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
    id: "autoemergency",
    name: "Auto Emergency ⭐",
    emoji: "⚔️",
    description: "Automated emergency quarantine upon coordinated attack detection",
    commands: [
      { name: "autoemergency config", description: "Configure auto-emergency thresholds & lockdown", usage: "autoemergency config" },
      { name: "autoemergency status", description: "View live Auto Emergency protocol state", usage: "autoemergency status" },
    ],
  },
  {
    id: "emergency",
    name: "Emergency",
    emoji: "❌",
    description: "Quarantine server by locking all channels and halting permissions",
    commands: [
      { name: "emergency / lockdown", description: "Instantly quarantine all server channels", usage: "emergency [reason]" },
      { name: "unemergency / unlock", description: "Restore all channel permissions from snapshot", usage: "unemergency" },
    ],
  },
  {
    id: "moderation",
    name: "Moderation",
    emoji: "🛠️",
    description: "High-speed server moderation, sequential case IDs & strike escalations",
    commands: [
      { name: "ban / unban", description: "Ban or unban a member with case tracking", usage: "ban <@user> [reason]" },
      { name: "kick", description: "Kick a member from the server", usage: "kick <@user> [reason]" },
      { name: "timeout / untimeout", description: "Timeout a member for specified duration", usage: "timeout <@user> <mins> [reason]" },
      { name: "softban", description: "Ban and unban to purge user messages", usage: "softban <@user> [reason]" },
      { name: "warn / warns", description: "Issue strike points with auto-escalation", usage: "warn <@user> <reason>" },
      { name: "jail / unjail", description: "Quarantine isolation with role snapshot & restoration", usage: "jail <@user> <reason> [minutes]" },
      { name: "case / history", description: "Lookup case or user moderation history", usage: "case <id> / case history <@user>" },
      { name: "lock / unlock", description: "Lock or unlock channel message sending", usage: "lock / unlock [#channel]" },
      { name: "hide / unhide", description: "Hide or unhide channel view permissions", usage: "hide / unhide [#channel]" },
      { name: "nuke", description: "Recreate channel with exact permissions & delete old", usage: "nuke" },
      { name: "purge / clear", description: "Bulk delete 1-100 messages", usage: "purge <amount> [@user]" },
    ],
  },
  {
    id: "utility",
    name: "Utility",
    emoji: "🔨",
    description: "General server information, diagnostics, and member tools",
    commands: [
      { name: "serverinfo", description: "Display detailed server analytics", usage: "serverinfo" },
      { name: "userinfo", description: "Inspect user profile, badges, and joined date", usage: "userinfo [@user]" },
      { name: "avatar / banner", description: "View full resolution avatar or profile banner", usage: "avatar / banner [@user]" },
      { name: "ping", description: "Check bot latency and gateway WebSocket ping", usage: "ping" },
      { name: "botinfo", description: "Display bot system statistics & memory", usage: "botinfo" },
      { name: "setup", description: "Universal interactive configuration wizard", usage: "setup" },
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
    id: "welcoming",
    name: "Welcoming",
    emoji: "🎴",
    description: "Join greetings, farewell goodbyes, and direct messages",
    commands: [
      { name: "welcome", description: "Configure greeting channel, card type and message", usage: "welcome <channel|message|type|preview|disable>" },
      { name: "goodbye", description: "Configure farewell channel and leave embeds", usage: "goodbye <channel|message|preview|disable>" },
      { name: "joindm", description: "Send custom welcome direct message to new members", usage: "joindm <set|disable> <message>" },
    ],
  },
  {
    id: "customroles",
    name: "Custom Roles",
    emoji: "🏷️",
    description: "Tiered custom roles (VIP, Friend, Staff, Girl) with required permissions",
    commands: [
      { name: "customrole create", description: "Register a custom group role", usage: "customrole create <name> <@role> [reqRole]" },
      { name: "customrole delete", description: "Delete a custom role mapping", usage: "customrole delete <name>" },
      { name: "customrole list", description: "List all active custom roles", usage: "customrole list" },
      { name: "reqrole", description: "Self-assign custom role if requirement is met", usage: "reqrole <name>" },
    ],
  },
  {
    id: "giveaway",
    name: "Giveaway",
    emoji: "🎉",
    description: "Persistent multi-winner giveaway engine with restart recovery",
    commands: [
      { name: "giveaway start", description: "Start a new giveaway with custom duration & winners", usage: "giveaway start <prize> <minutes> [winners]" },
      { name: "giveaway end", description: "Immediately end giveaway and pick winners", usage: "giveaway end <message_id>" },
      { name: "giveaway reroll", description: "Reroll winners for an ended giveaway", usage: "giveaway reroll <message_id>" },
      { name: "giveaway list", description: "List all active giveaways", usage: "giveaway list" },
    ],
  },
  {
    id: "vcban",
    name: "Boycott / Vcban",
    emoji: "🚫",
    description: "Persistent voice channel ban isolation that survives bot restarts",
    commands: [
      { name: "vcban user", description: "Ban user from connecting to any voice channels", usage: "vcban <@user> [reason]" },
      { name: "vcban unban", description: "Unban user from voice channels", usage: "vcban unban <@user>" },
      { name: "vcban list", description: "List all currently voice banned members", usage: "vcban list" },
      { name: "vcban reset", description: "Clear all voice bans in this server", usage: "vcban reset" },
    ],
  },
  {
    id: "automations",
    name: "Automations",
    emoji: "⚙️",
    description: "AutoRole, AutoReact, and Custom keyword AutoResponders",
    commands: [
      { name: "autorole", description: "Auto-assign human and bot roles upon joining", usage: "autorole <humans|bots> <add|remove|show> <@role>" },
      { name: "autoreact", description: "Auto-react custom emojis to new messages in channels", usage: "autoreact <add|remove> <#channel> <emoji>" },
      { name: "autoresponder", description: "Custom keyword response triggers with cooldowns", usage: "autoresponder <create|delete|list>" },
    ],
  },
  {
    id: "fun",
    name: "Fun",
    emoji: "🎮",
    description: "Interactive community entertainment and minigames",
    commands: [
      { name: "8ball", description: "Ask the Magic 8-Ball any question", usage: "8ball <question>" },
      { name: "coinflip", description: "Flip a coin for Heads or Tails", usage: "coinflip" },
      { name: "roll", description: "Roll a dice (1-6 or custom sides)", usage: "roll [sides]" },
      { name: "quote", description: "Get a daily quote of inspiration", usage: "quote" },
      { name: "rps", description: "Play Rock Paper Scissors against the bot", usage: "rps <rock|paper|scissors>" },
    ],
  },
  {
    id: "voice",
    name: "Voice",
    emoji: "🎙️",
    description: "Dynamic temporary Join-to-Create VC hub and voice moderation",
    commands: [
      { name: "voice setup", description: "Auto-provision dynamic Join-to-Create VC hub", usage: "voice setup" },
      { name: "voice lock / unlock", description: "Lock or unlock your temporary voice room", usage: "voice lock / unlock" },
      { name: "voice hide / unhide", description: "Hide or unhide your temporary voice room", usage: "voice hide / unhide" },
      { name: "voice limit", description: "Set max user capacity for your room", usage: "voice limit <capacity>" },
      { name: "voice claim", description: "Claim ownership if original room owner left", usage: "voice claim" },
      { name: "vckick / vcmute", description: "Voice disconnect or server-mute member", usage: "vckick / vcmute <@user>" },
    ],
  },
  {
    id: "adminsetup",
    name: "Admin / Mod Setup",
    emoji: "👥",
    description: "Internal staff permissions, audit logging, verification, and backups",
    commands: [
      { name: "staff add", description: "Create internal bot staff permission profile (No Admin needed)", usage: "staff add <@role> <name> <prio> <commands>" },
      { name: "staff list", description: "List all custom bot staff permission profiles", usage: "staff list" },
      { name: "logging all / set", description: "Configure hybrid or multi-channel audit logs", usage: "logging <all|set|status> <event> <#channel>" },
      { name: "verification setup", description: "Deploy 1-click button verification gatekeeper panel", usage: "verification setup <#channel> <@role>" },
      { name: "backup create / load", description: "Create & restore full server structure snapshots", usage: "backup <create|load|list|delete> [id]" },
    ],
  },
  {
    id: "ignore",
    name: "Ignore System",
    emoji: "👁️‍🗨️",
    description: "Granular command, channel, role, and module exemptions",
    commands: [
      { name: "ignore add", description: "Exempt channel, role, or user from bot modules", usage: "ignore add <target_id> <channel|role|user> <scope>" },
      { name: "ignore remove", description: "Remove ignore rule from target", usage: "ignore remove <target_id>" },
      { name: "ignore list", description: "List all active ignore and bypass rules", usage: "ignore list" },
    ],
  },
];

export function buildOverviewPage(prefix: string, botUser: any): EmbedBuilder {
  const totalCommands = ALL_17_MODULES.reduce((acc, cat) => acc + cat.commands.length, 0);

  const modulesList = ALL_17_MODULES.map((m) => `${m.emoji} : ${m.name}`).join("\n");

  return new EmbedBuilder()
    .setColor(AegisColors.Primary)
    .setAuthor({
      name: `${botUser.username} Commands Directory`,
      iconURL: botUser.displayAvatarURL(),
    })
    .setDescription(
      `• Prefix for this server is: \`${prefix}\`\n` +
      `• Type \`${prefix}help <module>\` or use the select menu below to explore a category.\n` +
      `• Total Commands: \`${totalCommands}\` across **${ALL_17_MODULES.length} Modules**.\n\n` +
      `**Module Commands:**\n${modulesList}\n\n` +
      `*Use the navigation buttons below to flip through pages.*`,
    )
    .setFooter({ text: `AegisX Platform • Page 1 of ${ALL_17_MODULES.length + 1}` })
    .setTimestamp();
}

export function buildCategoryPage(
  category: HelpCategory,
  prefix: string,
  pageIndex: number,
  totalPages: number,
): EmbedBuilder {
  const commandLines = category.commands
    .map((cmd) => `\`${prefix}${cmd.usage}\`\n*${cmd.description}*`)
    .join("\n\n");

  return new EmbedBuilder()
    .setColor(AegisColors.Primary)
    .setTitle(`${category.emoji} ${category.name} Commands`)
    .setDescription(
      `*${category.description}*\n\n` +
      `**Available Commands (${category.commands.length}):**\n\n` +
      commandLines,
    )
    .setFooter({ text: `AegisX Platform • Page ${pageIndex + 1} of ${totalPages}` })
    .setTimestamp();
}

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Interactive Command Directory & Documentation")
    .addStringOption((opt) =>
      opt
        .setName("category")
        .setDescription("Specific module category to open")
        .addChoices(
          ...ALL_17_MODULES.map((m) => ({ name: `${m.emoji} ${m.name}`, value: m.id })),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;
    const config = await getGuildConfig(interaction.guild.id);
    const prefix = config.prefix || ">";

    const selectedCategory = interaction.options.getString("category");

    const pages: PaginationPage[] = [
      { embed: buildOverviewPage(prefix, interaction.client.user), categoryId: "overview" },
      ...ALL_17_MODULES.map((cat, idx) => ({
        embed: buildCategoryPage(cat, prefix, idx + 1, ALL_17_MODULES.length + 1),
        categoryId: cat.id,
      })),
    ];

    const selectMenu = createSelectMenu(
      "help_cat_select",
      "Select a Category to View Details",
      [
        { label: "Overview / Home", value: "overview", emoji: "🏠", description: "Return to main module directory" },
        ...ALL_17_MODULES.map((m) => ({
          label: m.name,
          value: m.id,
          emoji: m.emoji,
          description: m.description.slice(0, 50),
        })),
      ],
    );

    let initialIndex = 0;
    if (selectedCategory) {
      const found = pages.findIndex((p) => p.categoryId === selectedCategory);
      if (found !== -1) initialIndex = found;
    }

    await sendPaginatedMenu(interaction, {
      pages,
      selectMenu,
      initialIndex,
    });
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    if (!message.guild) return;
    const config = await getGuildConfig(message.guild.id);
    const prefix = config.prefix || ">";

    const targetModule = args[0]?.toLowerCase();

    const pages: PaginationPage[] = [
      { embed: buildOverviewPage(prefix, message.client.user), categoryId: "overview" },
      ...ALL_17_MODULES.map((cat, idx) => ({
        embed: buildCategoryPage(cat, prefix, idx + 1, ALL_17_MODULES.length + 1),
        categoryId: cat.id,
      })),
    ];

    const selectMenu = createSelectMenu(
      "help_cat_select",
      "Select a Category to View Details",
      [
        { label: "Overview / Home", value: "overview", emoji: "🏠", description: "Return to main module directory" },
        ...ALL_17_MODULES.map((m) => ({
          label: m.name,
          value: m.id,
          emoji: m.emoji,
          description: m.description.slice(0, 50),
        })),
      ],
    );

    let initialIndex = 0;
    if (targetModule) {
      const found = pages.findIndex(
        (p) => p.categoryId?.toLowerCase() === targetModule || p.categoryId?.includes(targetModule),
      );
      if (found !== -1) initialIndex = found;
    }

    await sendPaginatedMenu(message, {
      pages,
      selectMenu,
      initialIndex,
    });
  },
};
