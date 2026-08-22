import type { Guild } from "discord.js";

import { auditLogService } from "../audit/audit-log.service.js";
import {
  securityExemptionService,
  type SecurityExemptionOptions,
  type SecurityActionType,
} from "../exemptions/security-exemption.service.js";
import { executorResolverService } from "../executor/executor-resolver.service.js";
import { getGuildConfig } from "../../services/guild-config.service.js";

import type { AuditLogEvent } from "discord.js";

export interface SecurityDecisionOptions
  extends SecurityExemptionOptions {
  eventName: string;
  action: AuditLogEvent;
  targetId?: string;
  actionType?: SecurityActionType;
}

export interface SecurityDecision {
  allowed: boolean;
  executorId: string | null;
  reason:
    | "no-audit-entry"
    | "executor-not-found"
    | "exempt"
    | "enforce"
    | null;
}

export class SecurityDecisionService {
  async evaluate(
    guild: Guild,
    options: SecurityDecisionOptions,
  ): Promise<SecurityDecision> {
    const audit =
      await auditLogService.findSecurityEntry(
        guild,
        {
          eventName: options.eventName,
          action: options.action,
          targetId: options.targetId,
        },
      );

    if (!audit) {
      return {
        allowed: false,
        executorId: null,
        reason: "no-audit-entry",
      };
    }

    const executorId = audit.executorId;

    if (!executorId) {
      return {
        allowed: false,
        executorId: null,
        reason: "no-audit-entry",
      };
    }

    const executor =
      await executorResolverService.resolve(
        guild,
        executorId,
      );

    if (!executor) {
      return {
        allowed: false,
        executorId,
        reason: "executor-not-found",
      };
    }

    // Load guild security config to get extra owners & granular whitelist
    const config = await getGuildConfig(guild.id);
    const extraOwners = config.security?.extraOwners ?? [];
    const whitelistedUsers = config.security?.whitelistedUsers ?? {};

    const exemption =
      securityExemptionService.check(
        guild,
        executor.user,
        {
          ...options,
          extraOwnerIds: options.extraOwnerIds ?? extraOwners,
          whitelistedUsers: options.whitelistedUsers ?? whitelistedUsers,
          actionType: options.actionType ?? "general",
        },
      );

    if (exemption.exempt) {
      return {
        allowed: false,
        executorId,
        reason: "exempt",
      };
    }

    return {
      allowed: true,
      executorId,
      reason: "enforce",
    };
  }
}

export const securityDecisionService =
  new SecurityDecisionService();