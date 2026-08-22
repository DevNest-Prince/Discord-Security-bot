import type { Message } from "discord.js";
import type { AutoModRule, AutoModRuleResult } from "../automod.types.js";

export class AntiMassMentionRule implements AutoModRule {
  readonly name = "Anti mass mention" as const;

  private readonly mentionThreshold = 4;

  evaluate(message: Message): AutoModRuleResult {
    const userMentions = message.mentions.users.size;
    const roleMentions = message.mentions.roles.size;
    const totalMentions = userMentions + roleMentions;

    if (totalMentions > this.mentionThreshold) {
      return {
        triggered: true,
        event: this.name,
        reason: `Mass mention detected (${totalMentions} mentions, threshold: ${this.mentionThreshold})`,
        timeoutMinutes: 3,
      };
    }

    return { triggered: false };
  }
}

export const antiMassMentionRule = new AntiMassMentionRule();
