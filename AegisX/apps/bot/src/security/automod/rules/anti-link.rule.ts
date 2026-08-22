import type { Message } from "discord.js";
import type { AutoModRule, AutoModRuleResult } from "../automod.types.js";

export class AntiLinkRule implements AutoModRule {
  readonly name = "Anti link" as const;

  private readonly linkPattern = /https?:\/\/\S+/i;
  private readonly invitePattern = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/\S+/i;
  private readonly gifPattern = /(\.gif($|\?)|^https:\/\/(tenor\.com|giphy\.com\/gifs|cdn\.discordapp\.com|media\.discordapp\.net))/i;
  private readonly spotifyPattern = /^https:\/\/open\.spotify\.com\/(track|album|playlist)\/\S+/i;

  evaluate(message: Message): AutoModRuleResult {
    const content = message.content;
    if (!content) return { triggered: false };

    if (this.linkPattern.test(content)) {
      // Bypasses
      if (this.invitePattern.test(content)) return { triggered: false }; // handled by anti-invites
      if (this.gifPattern.test(content)) return { triggered: false };
      if (this.spotifyPattern.test(content)) return { triggered: false };

      return {
        triggered: true,
        event: this.name,
        reason: "Posted an unauthorized link",
        timeoutMinutes: 7,
      };
    }

    return { triggered: false };
  }
}

export const antiLinkRule = new AntiLinkRule();
