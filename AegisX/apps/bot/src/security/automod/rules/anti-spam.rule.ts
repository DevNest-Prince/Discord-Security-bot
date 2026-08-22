import type { Message } from "discord.js";
import type { AutoModRule, AutoModRuleResult } from "../automod.types.js";

export class AntiSpamRule implements AutoModRule {
  readonly name = "Anti spam" as const;

  private readonly userTimestamps = new Map<string, number[]>();
  private readonly spamThreshold = 5;
  private readonly windowMs = 10_000;

  evaluate(message: Message): AutoModRuleResult {
    const userId = message.author.id;
    const guildId = message.guild?.id;
    if (!guildId) return { triggered: false };

    const key = `${guildId}:${userId}`;
    const now = Date.now();

    const timestamps = (this.userTimestamps.get(key) ?? []).filter((t) => now - t <= this.windowMs);
    timestamps.push(now);
    this.userTimestamps.set(key, timestamps);

    if (timestamps.length > this.spamThreshold) {
      // Clear timestamps after triggering to prevent repeated spam loop
      this.userTimestamps.delete(key);

      return {
        triggered: true,
        event: this.name,
        reason: "Message spamming (exceeded 5 messages in 10s)",
        timeoutMinutes: 12,
      };
    }

    return { triggered: false };
  }
}

export const antiSpamRule = new AntiSpamRule();
