export {
  AutoModService,
  autoModService,
} from "./automod.service.js";

export type {
  AutoModEventName,
  AutoModPunishmentType,
  AutoModRule,
  AutoModRuleResult,
} from "./automod.types.js";

export { antiLinkRule } from "./rules/anti-link.rule.js";
export { antiInvitesRule } from "./rules/anti-invites.rule.js";
export { antiSpamRule } from "./rules/anti-spam.rule.js";
export { antiCapsRule } from "./rules/anti-caps.rule.js";
export { antiMassMentionRule } from "./rules/anti-mass-mention.rule.js";
export { antiEmojiSpamRule } from "./rules/anti-emoji-spam.rule.js";
