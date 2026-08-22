import {
  EmbedBuilder,
  type Message,
  type TextChannel,
} from "discord.js";
import { getGuildConfig } from "../../services/guild-config.service.js";
import { antiLinkRule } from "./rules/anti-link.rule.js";
import { antiInvitesRule } from "./rules/anti-invites.rule.js";
import { antiSpamRule } from "./rules/anti-spam.rule.js";
import { antiCapsRule } from "./rules/anti-caps.rule.js";
import { antiMassMentionRule } from "./rules/anti-mass-mention.rule.js";
import { antiEmojiSpamRule } from "./rules/anti-emoji-spam.rule.js";
import type { AutoModRuleResult, AutoModEventName } from "./automod.types.js";

export class AutoModService {
  async handleMessage(message: Message): Promise<boolean> {
    if (message.author.bot || !message.guild || !message.member) {
      return false;
    }

    const guild = message.guild;
    const author = message.author;
    const member = message.member;
    const channel = message.channel;

    const config = await getGuildConfig(guild.id);
    const automod = config.automod;

    if (!automod || !automod.enabled) {
      return false;
    }

    // Bypass 1: Server Owner or Bot itself
    if (author.id === guild.ownerId || author.id === guild.client.user?.id) {
      return false;
    }

    // Bypass 2: Extra Owners
    const extraOwners = config.security?.extraOwners ?? [];
    if (extraOwners.includes(author.id)) {
      return false;
    }

    // Bypass 3: Ignored Channels
    if (automod.ignoredChannels?.includes(channel.id)) {
      return false;
    }

    // Bypass 4: Ignored Roles
    if (automod.ignoredRoles?.some((roleId) => member.roles.cache.has(roleId))) {
      return false;
    }

    // Bypass 5: Ignored Users
    if (automod.ignoredUsers?.includes(author.id)) {
      return false;
    }

    const punishments = automod.punishments ?? {};

    // 1. Anti-Link Check
    if (punishments["Anti link"]) {
      const linkResult = antiLinkRule.evaluate(message);
      if (linkResult.triggered) {
        await this.applyPunishment(message, linkResult, punishments["Anti link"]);
        return true;
      }
    }

    // 2. Anti-Invites Check
    if (punishments["Anti invites"]) {
      const inviteResult = await antiInvitesRule.evaluate(message);
      if (inviteResult.triggered) {
        await this.applyPunishment(message, inviteResult, punishments["Anti invites"]);
        return true;
      }
    }

    // 3. Anti-Spam Check
    if (punishments["Anti spam"]) {
      const spamResult = antiSpamRule.evaluate(message);
      if (spamResult.triggered) {
        await this.applyPunishment(message, spamResult, punishments["Anti spam"]);
        return true;
      }
    }

    // 4. Anti-Caps Check
    if (punishments["Anti caps"]) {
      const capsResult = antiCapsRule.evaluate(message);
      if (capsResult.triggered) {
        await this.applyPunishment(message, capsResult, punishments["Anti caps"]);
        return true;
      }
    }

    // 5. Anti-Mass Mention Check
    if (punishments["Anti mass mention"]) {
      const mentionResult = antiMassMentionRule.evaluate(message);
      if (mentionResult.triggered) {
        await this.applyPunishment(message, mentionResult, punishments["Anti mass mention"]);
        return true;
      }
    }

    // 6. Anti-Emoji Spam Check
    if (punishments["Anti emoji spam"]) {
      const emojiResult = antiEmojiSpamRule.evaluate(message);
      if (emojiResult.triggered) {
        await this.applyPunishment(message, emojiResult, punishments["Anti emoji spam"]);
        return true;
      }
    }

    return false;
  }

  private async applyPunishment(
    message: Message,
    ruleResult: AutoModRuleResult,
    configuredPunishment: string,
  ): Promise<void> {
    const member = message.member;
    const guild = message.guild;
    if (!member || !guild) return;

    const reason = `AutoMod: ${ruleResult.event ?? "Violation"} - ${ruleResult.reason ?? ""}`;
    let actionTaken = "Deleted Message";

    // 1. Delete the violating message immediately
    try {
      if (message.deletable) {
        await message.delete();
      }
    } catch (err) {
      console.warn("⚠️ Could not delete automod violating message:", err);
    }

    // 2. Execute punishment
    try {
      const punishment = configuredPunishment.toLowerCase();
      if (punishment === "mute") {
        const durationMinutes = ruleResult.timeoutMinutes ?? 5;
        await member.timeout(durationMinutes * 60 * 1000, reason);
        actionTaken = `Muted for ${durationMinutes} minutes`;
      } else if (punishment === "kick") {
        await member.kick(reason);
        actionTaken = "Kicked";
      } else if (punishment === "ban") {
        await member.ban({ reason });
        actionTaken = "Banned";
      }
    } catch (punishErr: any) {
      console.warn(`⚠️ Could not execute automod punishment on ${member.user.tag}:`, punishErr?.message ?? punishErr);
    }

    // 3. Send friendly in-channel notification embed (auto-deleted after 30s)
    try {
      if (message.channel && "send" in message.channel) {
        const notifyEmbed = new EmbedBuilder()
          .setTitle(`Automod ${ruleResult.event ?? "Violation"}`)
          .setColor(0xff0000)
          .setDescription(`✅ | <@${member.id}> has been successfully **${actionTaken}** for **${ruleResult.reason}**.`)
          .setFooter({
            text: "Use the “/automod logging” command to get automod logs if not enabled.",
            iconURL: guild.client.user?.displayAvatarURL(),
          });

        const alertMsg = await (message.channel as TextChannel).send({ embeds: [notifyEmbed] });
        setTimeout(() => {
          alertMsg.delete().catch(() => null);
        }, 30_000);
      }
    } catch {
      // Ignore channel send errors
    }

    // 4. Send rich log to AutoMod logging channel
    const config = await getGuildConfig(guild.id);
    const logChannelId = config.automod?.loggingChannel;
    if (logChannelId) {
      try {
        const logChannel = (await guild.channels.fetch(logChannelId).catch(() => null)) as TextChannel | null;
        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setTitle(`Automod Log: ${ruleResult.event ?? "Security"}`)
            .setColor(0xff0000)
            .addFields(
              { name: "User", value: `<@${member.id}> (\`${member.id}\`)`, inline: false },
              { name: "Action", value: `\`${actionTaken}\``, inline: false },
              { name: "Channel", value: `<#${message.channel.id}>`, inline: false },
              { name: "Reason", value: ruleResult.reason ?? "Automod violation", inline: false },
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: `User ID: ${member.id}` });

          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (logErr: any) {
        console.error("⚠️ Failed to send AutoMod log embed:", logErr?.message ?? logErr);
      }
    }
  }
}

export const autoModService = new AutoModService();
