import {
  enforcementService,
} from "../enforcement/index.js";
import {
  AuditLogEvent,
  EmbedBuilder,
  type Guild,
  type TextChannel,
} from "discord.js";

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
import type { SecurityActionType } from "../exemptions/security-exemption.service.js";

export interface HandleAntiNukeEventOptions {
  eventName: string;
  action: AuditLogEvent;
  targetId: string;
  actionType?: SecurityActionType;
  immediatePunish?: boolean;
  onRecover?: () => Promise<void>;
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
    const antiNuke = config.security?.antiNuke;

    if (!antiNuke || !antiNuke.enabled) {
      return {
        handled: false,
        triggered: false,
        executorId: null,
        threshold: null,
      };
    }

    const decision = await securityDecisionService.evaluate(guild, {
      eventName: options.eventName,
      action: options.action,
      targetId: options.targetId,
      actionType: options.actionType,
    });

    if (!decision.allowed || !decision.executorId) {
      return {
        handled: true,
        triggered: false,
        executorId: decision.executorId,
        threshold: null,
      };
    }

    const executorId = decision.executorId;
    const thresholdCount = options.immediatePunish ? 1 : antiNuke.threshold;

    let threshold: AntiNukeThresholdResult | null = null;
    let isTriggered = false;

    if (options.immediatePunish || antiNuke.threshold <= 1) {
      isTriggered = true;
    } else {
      threshold = await antiNukeTracker.record({
        guildId: guild.id,
        executorId,
        securityAction: options.actionType ?? antiNuke.action,
        windowSeconds: antiNuke.windowSeconds,
        threshold: thresholdCount,
      });
      isTriggered = threshold.triggered;
    }

    if (!isTriggered) {
      console.log(
        `🛡️ Anti-Nuke: ${options.eventName} by ${executorId} (${threshold?.count ?? 1}/${thresholdCount})`,
      );

      return {
        handled: true,
        triggered: false,
        executorId,
        threshold,
      };
    }

    // Threshold triggered: Execute Punishment
    const enforcement = await enforcementService.execute({
      guild,
      executorId,
      action: antiNuke.action,
      reason: `Anti-Nuke Triggered: ${options.eventName} | Unauthorized Action`,
    });

    // Execute Auto-Recovery if enabled
    if (antiNuke.recoveryEnabled !== false && options.onRecover) {
      try {
        await options.onRecover();
      } catch (recoveryErr: any) {
        console.error(`⚠️ Recovery execution failed:`, recoveryErr?.message ?? recoveryErr);
      }
    }

    // Send Security Log Alert
    await this.logSecurityEvent(guild, {
      eventName: options.eventName,
      executorId,
      actionTaken: enforcement.executed ? antiNuke.action.toUpperCase() : "FAILED / BLOCKED",
      reason: enforcement.reason,
      logChannelId: antiNuke.logChannelId,
    });

    return {
      handled: true,
      triggered: true,
      executorId,
      threshold,
    };
  }

  private async logSecurityEvent(
    guild: Guild,
    data: {
      eventName: string;
      executorId: string;
      actionTaken: string;
      reason: string;
      logChannelId?: string | null;
    },
  ): Promise<void> {
    if (!data.logChannelId) return;

    try {
      const channel = (await guild.channels.fetch(data.logChannelId).catch(() => null)) as TextChannel | null;
      if (!channel || !channel.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setTitle("🚨 Security Alert: Anti-Nuke Triggered")
        .setColor(0xff0000)
        .addFields(
          { name: "Event", value: `\`${data.eventName}\``, inline: true },
          { name: "Executor", value: `<@${data.executorId}> (\`${data.executorId}\`)`, inline: true },
          { name: "Action Taken", value: `\`${data.actionTaken}\``, inline: true },
          { name: "Reason", value: data.reason, inline: false },
        )
        .setTimestamp()
        .setFooter({ text: `AegisX Security Defense System`, iconURL: guild.client.user?.displayAvatarURL() });

      await channel.send({ embeds: [embed] });
    } catch (err: any) {
      console.error(`⚠️ Failed to send security log embed:`, err?.message ?? err);
    }
  }
}

export const antiNukeService = new AntiNukeService();