import type { Guild, User } from "discord.js";

export interface SecurityExemptionOptions {
  ownerIds?: readonly string[];
  whitelistIds?: readonly string[];
  botIds?: readonly string[];
}

export interface SecurityExemptionResult {
  exempt: boolean;
  reason:
    | "server-owner"
    | "configured-owner"
    | "whitelisted"
    | "bot"
    | null;
}

export class SecurityExemptionService {
  check(
    guild: Guild,
    executor: User,
    options: SecurityExemptionOptions = {},
  ): SecurityExemptionResult {
    const executorId = executor.id;

    if (executor.bot) {
      return {
        exempt: true,
        reason: "bot",
      };
    }

    if (guild.ownerId === executorId) {
      return {
        exempt: true,
        reason: "server-owner",
      };
    }

    if (options.ownerIds?.includes(executorId)) {
      return {
        exempt: true,
        reason: "configured-owner",
      };
    }

    if (options.whitelistIds?.includes(executorId)) {
      return {
        exempt: true,
        reason: "whitelisted",
      };
    }

    if (options.botIds?.includes(executorId)) {
      return {
        exempt: true,
        reason: "bot",
      };
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