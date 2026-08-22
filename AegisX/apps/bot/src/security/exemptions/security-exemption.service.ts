import type { Guild, User } from "discord.js";
import type { WhitelistPermissions } from "@aegisx/database";

export type SecurityActionType = keyof WhitelistPermissions | "general";

export interface SecurityExemptionOptions {
  actionType?: SecurityActionType;
  extraOwnerIds?: readonly string[];
  whitelistedUsers?: Record<string, WhitelistPermissions>;
  botOwnerIds?: readonly string[];
}

export interface SecurityExemptionResult {
  exempt: boolean;
  reason:
    | "server-owner"
    | "extra-owner"
    | "bot-owner"
    | "self-bot"
    | "whitelisted"
    | null;
}

export class SecurityExemptionService {
  check(
    guild: Guild,
    executor: User,
    options: SecurityExemptionOptions = {},
  ): SecurityExemptionResult {
    const executorId = executor.id;

    // 1. Bot's own client actions are always exempt
    if (guild.client.user && executorId === guild.client.user.id) {
      return {
        exempt: true,
        reason: "self-bot",
      };
    }

    // 2. Server Owner is always exempt
    if (guild.ownerId === executorId) {
      return {
        exempt: true,
        reason: "server-owner",
      };
    }

    // 3. Extra Owners configured on the server
    if (options.extraOwnerIds?.includes(executorId)) {
      return {
        exempt: true,
        reason: "extra-owner",
      };
    }

    // 4. Global Bot Developers / Owners configured in ENV
    const envBotOwners = (process.env.OWNER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (envBotOwners.includes(executorId) || options.botOwnerIds?.includes(executorId)) {
      return {
        exempt: true,
        reason: "bot-owner",
      };
    }

    // 5. Granular Whitelist per action
    const userPermissions = options.whitelistedUsers?.[executorId];
    if (userPermissions) {
      const actionType = options.actionType;
      if (!actionType || actionType === "general") {
        return {
          exempt: true,
          reason: "whitelisted",
        };
      }

      if (userPermissions[actionType] === true) {
        return {
          exempt: true,
          reason: "whitelisted",
        };
      }
    }

    return {
      exempt: false,
      reason: null,
    };
  }

  isExempt(
    guild: Guild,
    executor: User,
    options: SecurityExemptionOptions = {},
  ): boolean {
    return this.check(guild, executor, options).exempt;
  }
}

export const securityExemptionService =
  new SecurityExemptionService();