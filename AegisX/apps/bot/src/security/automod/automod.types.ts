import type { Message, GuildMember } from "discord.js";

export type AutoModEventName =
  | "Anti link"
  | "Anti invites"
  | "Anti spam"
  | "Anti caps"
  | "Anti mass mention"
  | "Anti emoji spam"
  | "Anti NSFW link";

export type AutoModPunishmentType = "Mute" | "Kick" | "Ban" | "Block";

export interface AutoModRuleResult {
  triggered: boolean;
  event?: AutoModEventName;
  reason?: string;
  punishment?: AutoModPunishmentType;
  timeoutMinutes?: number;
}

export interface AutoModRule {
  readonly name: AutoModEventName;
  evaluate(message: Message, member: GuildMember): Promise<AutoModRuleResult> | AutoModRuleResult;
}
