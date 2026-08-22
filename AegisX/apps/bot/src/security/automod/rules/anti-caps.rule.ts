import type { Message } from "discord.js";
import type { AutoModRule, AutoModRuleResult } from "../automod.types.js";

export class AntiCapsRule implements AutoModRule {
  readonly name = "Anti caps" as const;

  private readonly minLength = 45;
  private readonly maxCapsPercentage = 0.70; // 70%

  evaluate(message: Message): AutoModRuleResult {
    const content = message.content?.trim();
    if (!content || content.length < this.minLength) {
      return { triggered: false };
    }

    const letters = content.replace(/[^a-zA-Z]/g, "");
    if (letters.length < this.minLength) {
      return { triggered: false };
    }

    const upperLetters = content.replace(/[^A-Z]/g, "").length;
    const capsRatio = upperLetters / letters.length;

    if (capsRatio > this.maxCapsPercentage) {
      return {
        triggered: true,
        event: this.name,
        reason: `Excessive capitalization (${Math.round(capsRatio * 100)}% caps)`,
        timeoutMinutes: 1,
      };
    }

    return { triggered: false };
  }
}

export const antiCapsRule = new AntiCapsRule();
