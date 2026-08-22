import type { Message } from "discord.js";
import type { AutoModRule, AutoModRuleResult } from "../automod.types.js";

export class AntiInvitesRule implements AutoModRule {
  readonly name = "Anti invites" as const;

  private readonly inviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/([a-zA-Z0-9\-]+)/gi;

  async evaluate(message: Message): Promise<AutoModRuleResult> {
    const content = message.content;
    if (!content || !message.guild) return { triggered: false };

    const matches = [...content.matchAll(this.inviteRegex)];
    if (matches.length === 0) return { triggered: false };

    for (const match of matches) {
      const code = match[1];
      if (!code) continue;

      try {
        const invite = await message.client.fetchInvite(code).catch(() => null);
        // If the invite belongs to this very guild, bypass it!
        if (invite && invite.guild?.id === message.guild.id) {
          continue;
        }
      } catch {
        // In case of error, treat as external invite
      }

      return {
        triggered: true,
        event: this.name,
        reason: "Posted an external Discord server invite",
        timeoutMinutes: 12,
      };
    }

    return { triggered: false };
  }
}

export const antiInvitesRule = new AntiInvitesRule();
