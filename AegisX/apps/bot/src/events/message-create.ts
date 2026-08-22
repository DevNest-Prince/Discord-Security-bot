import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Message,
  type TextChannel,
} from "discord.js";
import { autoModService } from "../security/automod/index.js";
import { getGuildConfig } from "../services/guild-config.service.js";
import { securityExemptionService } from "../security/exemptions/security-exemption.service.js";
import { enforcementService } from "../security/enforcement/enforcement.service.js";
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
  joindmCommand,
  backupCommand,
} from "../commands/index.js";


export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot || !message.guild || !message.member) {
    return;
  }

  const guild = message.guild;
  const author = message.author;
  const client = guild.client;
  const botId = client.user?.id;

  // 1. Bot Mention Response (@Bot or @Bot help)
  const mentionRegex = new RegExp(`^<@!?${botId}>(?:\\s+help)?$`, "i");
  if (botId && mentionRegex.test(message.content.trim())) {
    try {
      const config = await getGuildConfig(guild.id);
      const prefix = config.prefix || ">";

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.user?.username ?? "AegisX"} Security Assistant`,
          iconURL: client.user?.displayAvatarURL(),
        })
        .setColor(0xff0033)
        .setDescription(
          `Hey <@${author.id}>! My prefix for **${guild.name}** is \`${prefix}\`\n\n` +
          `• Type \`${prefix}help\` to view all modules and commands.\n` +
          `• Total Commands: **45+** | Slash: **28**\n\n` +
          `**Main Defense Modules:**\n` +
          `🛡️ : Antinuke Security\n` +
          `🔒 : Anti Betray ⭐\n` +
          `🎚️ : Limit System ⭐\n` +
          `❌ : Emergency & Lockdown\n` +
          `🚨 : Automod Engine\n` +
          `🛠️ : Moderation Suite\n\n` +
          `*Need assistance? Click the support or invite buttons below!*`,
        )
        .setFooter({ text: `AegisX Security Defense`, iconURL: client.user?.displayAvatarURL() });

      const btnInvite = new ButtonBuilder()
        .setLabel("Invite AegisX")
        .setURL(`https://discord.com/oauth2/authorize?client_id=${botId}&permissions=8&scope=bot%20applications.commands`)
        .setStyle(ButtonStyle.Link);

      const btnSupport = new ButtonBuilder()
        .setLabel("Support Server")
        .setURL("https://discord.gg/")
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btnInvite, btnSupport);

      await message.reply({ embeds: [embed], components: [row] });
      return;
    } catch (err) {
      console.error("⚠️ Failed to reply to bot mention:", err);
    }
  }

  // 2. Anti-Everyone / Anti-Here Check
  if (message.mentions.everyone) {
    try {
      const config = await getGuildConfig(guild.id);
      if (config.security?.antiNuke?.enabled) {
        const exemption = securityExemptionService.check(guild, author, {
          actionType: "meneve",
          extraOwnerIds: config.security.extraOwners,
          whitelistedUsers: config.security.whitelistedUsers,
        });

        if (!exemption.exempt) {
          await message.delete().catch(() => null);

          await enforcementService.execute({
            guild,
            executorId: author.id,
            action: "timeout",
            reason: "Anti-Nuke: Unauthorized @everyone / @here mention",
            timeoutMinutes: 60,
          });

          if (message.channel && "send" in message.channel) {
            const embed = new EmbedBuilder()
              .setTitle("🚨 Anti-Everyone Triggered")
              .setColor(0xff0000)
              .setDescription(`❌ | <@${author.id}> has been **timed out for 1 hour** for unauthorized \`@everyone\` / \`@here\` mention.`)
              .setFooter({ text: `AegisX Security Defense`, iconURL: client.user?.displayAvatarURL() });

            const alertMsg = await (message.channel as TextChannel).send({ embeds: [embed] });
            setTimeout(() => alertMsg.delete().catch(() => null), 15_000);
          }

          return;
        }
      }
    } catch (err) {
      console.error("⚠️ Anti-Everyone check error:", err);
    }
  }

  // 3. AutoMod Pipeline
  const automodHandled = await autoModService.handleMessage(message);
  if (automodHandled) {
    return;
  }

  // 4. Prefix Command Execution
  try {
    const config = await getGuildConfig(guild.id);
    const prefix = config.prefix || ">";

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
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
      case "eo":
        await extraownerCommand.executePrefix(message, args);
        break;
      case "automod":
        await automodCommand.executePrefix(message, args);
        break;
      case "emergency":
        await emergencyCommand.executePrefix(message, args, "lockdown");
        break;
      case "unemergency":
        await emergencyCommand.executePrefix(message, args, "restore");
        break;
      case "lockdown":
        await emergencyCommand.executePrefix(message, args, "lockdown");
        break;
      case "unlockdown":
        await emergencyCommand.executePrefix(message, args, "restore");
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
      case "invcrole":
        await customrolesCommand.executePrefix(message, args);
        break;
      case "j2c":
        await j2cCommand.executePrefix(message, args);
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
      default:
        break;
    }
  } catch (cmdErr) {
    console.error("❌ Prefix command execution error:", cmdErr);
  }

  // 6. Handle Leveling XP & AutoReact
  try {
    const { handleMessageXp } = await import("../services/management/leveling.service.js");
    await handleMessageXp(message);

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


