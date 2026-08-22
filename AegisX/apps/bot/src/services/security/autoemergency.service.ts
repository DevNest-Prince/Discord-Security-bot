import { type Guild, EmbedBuilder } from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { emergencyService } from "../../security/emergency/emergency.service.js";
import { dispatchLog } from "../logging/audit-logger.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

interface SecurityTriggerRecord {
  type: string;
  executorId: string;
  timestamp: number;
}

const recentSecurityEvents = new Map<string, SecurityTriggerRecord[]>(); // guildId -> records

export class AutoEmergencyService {
  /**
   * Tracks a security violation and checks if auto emergency threshold is reached
   */
  async trackEvent(
    guild: Guild,
    event: { type: string; executorId: string },
  ): Promise<{ triggered: boolean; reason?: string }> {
    const config = await getGuildConfig(guild.id);
    const autoCfg = config.autoEmergency || {
      enabled: true,
      triggerThreshold: 3,
      windowSeconds: 30,
      quarantineChannels: true,
      stripRogueRoles: true,
      logChannelId: null,
    };

    if (!autoCfg.enabled) return { triggered: false };

    const now = Date.now();
    const windowMs = autoCfg.windowSeconds * 1000;
    const history = (recentSecurityEvents.get(guild.id) || []).filter((r) => now - r.timestamp < windowMs);

    history.push({ ...event, timestamp: now });
    recentSecurityEvents.set(guild.id, history);

    if (history.length >= autoCfg.triggerThreshold) {
      // Clear recent queue to prevent multiple consecutive triggers
      recentSecurityEvents.set(guild.id, []);

      const reason = `Auto Emergency Triggered: ${history.length} security alerts in ${autoCfg.windowSeconds}s`;

      if (autoCfg.quarantineChannels) {
        await emergencyService.enableEmergency(guild, reason);
      }

      const alertEmbed = new EmbedBuilder()
        .setColor(AegisColors.Danger)
        .setTitle("⚔️ AUTO EMERGENCY PROTOCOL ACTIVATED")
        .setDescription(
          `**A coordinated server attack was automatically intercepted!**\n\n` +
          `• **Trigger Threshold:** \`${history.length} events / ${autoCfg.windowSeconds}s\`\n` +
          `• **Quarantine State:** All channels locked\n` +
          `• **Primary Offender:** <@${event.executorId}>\n` +
          `• **Action Required:** Server Owner should verify server security with \`/security status\` and lift lockdown with \`/security unlock\`.`,
        )
        .setTimestamp();

      await dispatchLog(guild, "security", alertEmbed);

      return { triggered: true, reason };
    }

    return { triggered: false };
  }
}

export const autoEmergencyService = new AutoEmergencyService();
