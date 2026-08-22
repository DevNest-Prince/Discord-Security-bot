import {
  AuditLogEvent,
  PermissionFlagsBits,
  type Message,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { antiNukeService, recoveryService } from "../security/antinuke/index.js";
import { autoModService } from "../security/automod/index.js";
import {

  helpCommand,
  antinukeCommand,
  whitelistCommand,
  extraownerCommand,
  automodCommand,
  emergencyCommand,
  antibetrayCommand,
  limitCommand,
  banCommand,
  unbanCommand,
  kickCommand,
  muteCommand,
  unmuteCommand,
  lockCommand,
  unlockCommand,
  hideCommand,
  unhideCommand,
  nukeCommand,
  purgeCommand,
  vckickCommand,
  vcmuteCommand,
  vcunmuteCommand,
  pingCommand,
  serverinfoCommand,
  botinfoCommand,
  infoCommand,
  securityCommand,
  raidCommand,
  autoEmergencyCommand,
  warnCommand,
  casesCommand,
  jailCommand,
  staffCommand,
  goodbyeCommand,
  voiceCommand,
  vcBanCommand,
  giveawayCommand,
  setupCommand,
  autoroleCommand,
  welcomeCommand,
  verificationCommand,
  vanityrolesCommand,
  ticketsCommand,
  levelingCommand,
  loggingCommand,
  customrolesCommand,
  j2cCommand,
  autoreactCommand,
  autoResponderCommand,
  funCommand,
  ignoreCommand,
  joindmCommand,
  backupCommand,
} from "../commands/index.js";

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot || !message.guild || !message.member) {
    return;
  }

  // 1. Check Ignore & Exemption System
  try {
    const { ignoreService } = await import("../services/management/ignore.service.js");
    const isIgnored = await ignoreService.isIgnored(
      message.guild.id,
      {
        channelId: message.channel.id,
        roleIds: message.member.roles.cache.map((r) => r.id),
        userId: message.author.id,
      },
      "commands",
    );
    if (isIgnored && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return;
    }
  } catch {}

  // 2. Anti-Everyone / Anti-Here Mention Defense
  if (message.mentions.everyone) {
    try {
      await antiNukeService.handle(message.guild, {
        eventName: "mentionEveryone",
        action: AuditLogEvent.MemberUpdate,
        targetId: message.author.id,
        actionType: "meneve",
        immediatePunish: true,
        onRecover: async () => {
          await message.delete().catch(() => {});
        },
      });
    } catch (error) {
      console.error(
        `❌ Anti-Nuke message handler failed in guild ${message.guild.id}:`,
        error,
      );
    }
  }

  // 3. AutoMod Real-time Content Filter Pipeline
  try {
    const automodBlocked = await autoModService.handleMessage(message);
    if (automodBlocked) {
      return; // Stop processing if message was deleted/punished by AutoMod
    }
  } catch (automodErr) {

    console.error("❌ AutoMod execution error:", automodErr);
  }

  // 4. Custom Keyword AutoResponder Engine
  try {
    const { autoResponderService } = await import("../services/automation/autoresponder.service.js");
    const autoReplied = await autoResponderService.handleMessage(message);
    if (autoReplied) return;
  } catch {}

  // 5. Prefix Command Dispatcher
  try {
    const guildConfig = await getGuildConfig(message.guild.id);
    const prefix = guildConfig.prefix || ">";

    if (!message.content.startsWith(prefix)) {
      return;
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    switch (commandName) {
      case "help":
        await helpCommand.executePrefix(message, args);
        break;
      case "antinuke":
        await antinukeCommand.executePrefix(message, args);
        break;
      case "whitelist":
      case "wl":
        await whitelistCommand.executePrefix(message, args);
        break;
      case "extraowner":
        await extraownerCommand.executePrefix(message, args);
        break;
      case "automod":
        await automodCommand.executePrefix(message, args);
        break;
      case "emergency":
        await emergencyCommand.executePrefix(message, ["lockdown", ...args]);
        break;
      case "unemergency":
        await emergencyCommand.executePrefix(message, ["unlockdown", ...args]);
        break;
      case "autoemergency":
        await autoEmergencyCommand.executePrefix(message, args);
        break;
      case "antibetray":
        await antibetrayCommand.executePrefix(message, args);
        break;
      case "limit":
      case "limits":
        await limitCommand.executePrefix(message, args);
        break;
      case "ban":
        await banCommand.executePrefix(message, args);
        break;
      case "unban":
        await unbanCommand.executePrefix(message, args);
        break;
      case "kick":
        await kickCommand.executePrefix(message, args);
        break;
      case "mute":
      case "timeout":
        await muteCommand.executePrefix(message, args);
        break;
      case "unmute":
      case "untimeout":
        await unmuteCommand.executePrefix(message, args);
        break;
      case "lock":
        await lockCommand.executePrefix(message);
        break;
      case "unlock":
        await unlockCommand.executePrefix(message);
        break;
      case "hide":
        await hideCommand.executePrefix(message);
        break;
      case "unhide":
        await unhideCommand.executePrefix(message);
        break;
      case "nuke":
        await nukeCommand.executePrefix(message);
        break;
      case "purge":
      case "clear":
        await purgeCommand.executePrefix(message, args);
        break;
      case "vckick":
        await vckickCommand.executePrefix(message, args);
        break;
      case "vcmute":
        await vcmuteCommand.executePrefix(message, args);
        break;
      case "vcunmute":
        await vcunmuteCommand.executePrefix(message, args);
        break;
      case "ping":
        await pingCommand.executePrefix(message);
        break;
      case "serverinfo":
      case "si":
        await serverinfoCommand.executePrefix(message);
        break;
      case "userinfo":
      case "ui":
      case "avatar":
      case "av":
      case "banner":
        await infoCommand.executePrefix(message, args);
        break;
      case "botinfo":
      case "bi":
      case "stats":
        await botinfoCommand.executePrefix(message);
        break;
      case "autorole":
        await autoroleCommand.executePrefix(message, args);
        break;
      case "welcome":
        await welcomeCommand.executePrefix(message, args);
        break;
      case "goodbye":
        await goodbyeCommand.executePrefix(message, args);
        break;
      case "verification":
      case "verify":
        await verificationCommand.executePrefix(message, args);
        break;
      case "vanityrole":
      case "vanity":
        await vanityrolesCommand.executePrefix(message, args);
        break;
      case "ticket":
      case "tickets":
        await ticketsCommand.executePrefix(message, args);
        break;
      case "rank":
      case "level":
      case "xp":
        await levelingCommand.executePrefix(message, args);
        break;
      case "leaderboard":
      case "top":
      case "lb":
        await levelingCommand.executePrefix(message, ["leaderboard", ...args]);
        break;
      case "logging":
      case "logs":
        await loggingCommand.executePrefix(message, args);
        break;
      case "customroles":
      case "customrole":
      case "invcrole":
        await customrolesCommand.executePrefix(message, args);
        break;
      case "j2c":
      case "voice":
        await voiceCommand.executePrefix(message, args);
        break;
      case "vcban":
      case "boycott":
        await vcBanCommand.executePrefix(message, args);
        break;
      case "giveaway":
      case "gstart":
      case "gend":
      case "greroll":
      case "glist":
        await giveawayCommand.executePrefix(message, [commandName, ...args]);
        break;
      case "autoresponder":
      case "ar":
        await autoResponderCommand.executePrefix(message, args);
        break;
      case "8ball":
      case "coinflip":
      case "flip":
      case "roll":
      case "dice":
      case "quote":
      case "rps":
        await funCommand.executePrefix(message, [commandName, ...args]);
        break;
      case "ignore":
      case "bypass":
        await ignoreCommand.executePrefix(message, args);
        break;
      case "autoreact":
        await autoreactCommand.executePrefix(message, args);
        break;
      case "joindm":
        await joindmCommand.executePrefix(message, args);
        break;
      case "backup":
        await backupCommand.executePrefix(message, args);
        break;
      case "setup":
        await setupCommand.executePrefix(message);
        break;
      case "security":
        await securityCommand.executePrefix(message, args);
        break;
      case "raid":
        await raidCommand.executePrefix(message, args);
        break;
      case "warn":
      case "warns":
      case "warnings":
        await warnCommand.executePrefix(message, args);
        break;
      case "case":
      case "history":
        await casesCommand.executePrefix(message, args);
        break;
      case "jail":
      case "unjail":
        await jailCommand.executePrefix(message, args);
        break;
      case "staff":
        await staffCommand.executePrefix(message, args);
        break;
      default:
        break;
    }
  } catch (cmdErr) {
    console.error("❌ Prefix command execution error:", cmdErr);
  }

  // 6. Handle Leveling XP, Activity Tracking & AutoReact
  try {
    const { handleMessageXp } = await import("../services/management/leveling.service.js");
    await handleMessageXp(message);

    const { activityService } = await import("../services/management/activity.service.js");
    await activityService.handleMessage(message);

    const guildCfg = await getGuildConfig(message.guild.id);
    const reactRules = guildCfg.autoReact || [];
    const matchedRule = reactRules.find((r) => r.channelId === message.channel.id);
    if (matchedRule && matchedRule.emojis.length > 0) {
      for (const emoji of matchedRule.emojis) {
        await message.react(emoji).catch(() => {});
      }
    }
  } catch {}
}
