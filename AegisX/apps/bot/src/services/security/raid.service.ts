import { type Guild, type GuildMember, EmbedBuilder } from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { dispatchLog } from "../logging/audit-logger.service.js";
import { emergencyService } from "../../security/emergency/emergency.service.js";

import { AegisColors } from "../../utils/ui/colors.js";

interface JoinRecord {
  memberId: string;
  joinedAt: number;
}

export class RaidService {
  private joinTracker = new Map<string, JoinRecord[]>();

  async handleMemberJoin(member: GuildMember): Promise<{ isRaid: boolean; actionTaken?: string }> {
    const guild = member.guild;
    const config = await getGuildConfig(guild.id);
    const raidConfig = config.raid || {
      enabled: true,
      joinThreshold: 5,
      windowSeconds: 10,
      minAccountAgeDays: 3,
      action: "verification",
    };

    if (!raidConfig.enabled) return { isRaid: false };

    const now = Date.now();
    const windowMs = (raidConfig.windowSeconds || 10) * 1000;

    // 1. Update Join Tracking
    const joins = (this.joinTracker.get(guild.id) || []).filter((j) => now - j.joinedAt <= windowMs);
    joins.push({ memberId: member.id, joinedAt: now });
    this.joinTracker.set(guild.id, joins);

    // 2. Check Account Age
    const accountAgeDays = (now - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
    const isSuspiciousAccount = accountAgeDays < (raidConfig.minAccountAgeDays || 3);

    // 3. Detect Raid Burst
    const isBurst = joins.length >= (raidConfig.joinThreshold || 5);

    if (isBurst || isSuspiciousAccount) {
      let actionTaken = raidConfig.action || "verification";

      if (isBurst) {
        // Trigger Emergency Lockdown
        await emergencyService.enableEmergency(guild, `Anti-Raid: Join burst detected (${joins.length} joins in ${raidConfig.windowSeconds}s)`);

        const alertEmbed = new EmbedBuilder()
          .setColor(AegisColors.Danger)
          .setTitle("🚨 RAID ATTACK DETECTED — SERVER QUARANTINED")
          .setDescription(
            `**Trigger:** Rapid join burst of \`${joins.length} accounts\` in \`${raidConfig.windowSeconds}s\`\n` +
            `**Defense Action:** Server channels locked down & quarantined.\n` +
            `**Latest Join:** <@${member.id}> (\`${member.user.tag}\`)`,
          )
          .setTimestamp();

        await dispatchLog(guild, "security", alertEmbed);
        return { isRaid: true, actionTaken: "emergency_lockdown" };
      }

      if (isSuspiciousAccount) {
        const alertEmbed = new EmbedBuilder()
          .setColor(AegisColors.Warning)
          .setTitle("⚠️ Suspicious New Account Joined")
          .setDescription(
            `**User:** <@${member.id}> (\`${member.user.tag}\`)\n` +
            `**Account Age:** \`${Math.round(accountAgeDays * 24)} hours old\` (Threshold: ${raidConfig.minAccountAgeDays} days)`,
          )
          .setTimestamp();
        await dispatchLog(guild, "security", alertEmbed);
      }
    }

    return { isRaid: false };
  }
}

export const raidService = new RaidService();
