import type { Message } from "discord.js";
import type { AutoModRule, AutoModRuleResult } from "../automod.types.js";

export class AntiEmojiSpamRule implements AutoModRule {
  readonly name = "Anti emoji spam" as const;

  private readonly emojiThreshold = 5;
  private readonly customEmojiRegex = /<a?:[a-zA-Z0-9_]+:[0-9]+>/g;
  private readonly unicodeEmojiRegex = /\p{Extended_Pictographic}/gu;

  evaluate(message: Message): AutoModRuleResult {
    const content = message.content;
    if (!content) return { triggered: false };

    const customEmojis = content.match(this.customEmojiRegex) ?? [];
    const unicodeEmojis = content.match(this.unicodeEmojiRegex) ?? [];
    const totalEmojis = customEmojis.length + unicodeEmojis.length;

    if (totalEmojis > this.emojiThreshold) {
      return {
        triggered: true,
        event: this.name,
        reason: `Emoji spam detected (${totalEmojis} emojis, limit: ${this.emojiThreshold})`,
        timeoutMinutes: 1,
      };
    }

    return { triggered: false };
  }
}

export const antiEmojiSpamRule = new AntiEmojiSpamRule();
