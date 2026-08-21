import type { Guild } from "discord.js";

import { getGuildConfig } from "../../services/guild-config.service.js";

import {
  securityDecisionService,
} from "../decision/security-decision.service.js";

import {
  antiNukeTracker,
} from "./anti-nuke-tracker.js";

import type {
  AntiNukeThresholdResult,
} from "./anti-nuke.types.js";

import { AuditLogEvent } from "discord.js";

export interface HandleAntiNukeEventOptions {
  eventName: string;
  action: AuditLogEvent;
  targetId: string;
}

export interface AntiNukeResult {
  handled: boolean;
  triggered: boolean;
  executorId: string | null;
  threshold: AntiNukeThresholdResult | null;
}

export class AntiNukeService {
  async handle(
    guild: Guild,
    options: HandleAntiNukeEventOptions,
  ): Promise<AntiNukeResult> {
    const config = await getGuildConfig(guild.id);

    const antiNuke =
  config.security?.antiNuke;

if (!antiNuke || !antiNuke.enabled) {
      return {
        handled: false,
        triggered: false,
        executorId: null,
        threshold: null,
      };
    }

    if (
      antiNuke.threshold <= 0 ||
      antiNuke.windowSeconds <= 0
    ) {
      console.warn(
        `⚠️ Invalid Anti-Nuke configuration for guild ${guild.id}`,
      );

      return {
        handled: false,
        triggered: false,
        executorId: null,
        threshold: null,
      };
    }

    const decision =
      await securityDecisionService.evaluate(
        guild,
        {
          eventName: options.eventName,
          action: options.action,
          targetId: options.targetId,
        },
      );

    if (!decision.allowed) {
      return {
        handled: true,
        triggered: false,
        executorId: decision.executorId,
        threshold: null,
      };
    }

    if (!decision.executorId) {
      return {
        handled: true,
        triggered: false,
        executorId: null,
        threshold: null,
      };
    }

    const threshold =
      antiNukeTracker.record(
        guild.id,
        decision.executorId,
        options.eventName,
        antiNuke.windowSeconds,
        antiNuke.threshold,
      );

    if (!threshold.triggered) {
      console.log(
        `🛡️ Anti-Nuke: ${options.eventName} ` +
        `by ${decision.executorId} ` +
        `(${threshold.count}/${threshold.threshold})`,
      );

      return {
        handled: true,
        triggered: false,
        executorId: decision.executorId,
        threshold,
      };
    }

    console.warn(
      `🚨 Anti-Nuke threshold triggered in ${guild.id}: ` +
      `${options.eventName} by ${decision.executorId} ` +
      `(${threshold.count}/${threshold.threshold})`,
    );

    return {
      handled: true,
      triggered: true,
      executorId: decision.executorId,
      threshold,
    };
  }
}

export const antiNukeService =
  new AntiNukeService();