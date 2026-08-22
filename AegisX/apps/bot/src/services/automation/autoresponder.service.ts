import type { Message } from "discord.js";
import {
  listAutoResponders,
  upsertAutoResponder,
  deleteAutoResponder,
  type AutoResponderRule,
} from "@aegisx/database";

const cooldownMap = new Map<string, number>(); // `${guildId}_${trigger}` -> timestamp

export class AutoResponderService {
  async handleMessage(message: Message): Promise<boolean> {
    if (message.author.bot || !message.guild || !message.content) return false;

    const rules = await listAutoResponders(message.guild.id);
    if (rules.length === 0) return false;

    const contentLower = message.content.toLowerCase().trim();

    for (const rule of rules) {
      // Check channel / role ignores
      if (rule.ignoredChannels.includes(message.channel.id)) continue;
      if (message.member?.roles.cache.some((r) => rule.ignoredRoles.includes(r.id))) continue;

      let matched = false;
      const trigger = rule.trigger.toLowerCase();

      if (rule.matchType === "exact" && contentLower === trigger) {
        matched = true;
      } else if (rule.matchType === "contains" && contentLower.includes(trigger)) {
        matched = true;
      } else if (rule.matchType === "startswith" && contentLower.startsWith(trigger)) {
        matched = true;
      } else if (rule.matchType === "endswith" && contentLower.endsWith(trigger)) {
        matched = true;
      } else if (rule.matchType === "regex") {
        try {
          const reg = new RegExp(rule.trigger, "i");
          if (reg.test(message.content)) matched = true;
        } catch {}
      }

      if (matched) {
        // Check cooldown
        const cdKey = `${message.guild.id}_${rule.trigger}`;
        const lastTrigger = cooldownMap.get(cdKey) || 0;
        const now = Date.now();

        if (now - lastTrigger < rule.cooldownSeconds * 1000) {
          return false;
        }

        cooldownMap.set(cdKey, now);

        // Delete trigger message if configured
        if (rule.deleteTrigger) {
          await message.delete().catch(() => {});
        }

        // Send response
        if (rule.replyInDm) {
          await message.author.send({ content: rule.response }).catch(() => {});
        } else if ("send" in message.channel) {
          await (message.channel as any).send({ content: rule.response }).catch(() => {});
        }


        return true;
      }
    }

    return false;
  }

  async addRule(
    guildId: string,
    trigger: string,
    response: string,
    matchType: "exact" | "contains" | "startswith" | "endswith" | "regex" = "exact",
    cooldownSeconds = 3,
  ) {
    return upsertAutoResponder(guildId, trigger, {
      response,
      matchType,
      cooldownSeconds,
      ignoredChannels: [],
      ignoredRoles: [],
      replyInDm: false,
      deleteTrigger: false,
    });
  }

  async removeRule(guildId: string, trigger: string) {
    return deleteAutoResponder(guildId, trigger);
  }

  async getRules(guildId: string) {
    return listAutoResponders(guildId);
  }
}

export const autoResponderService = new AutoResponderService();
