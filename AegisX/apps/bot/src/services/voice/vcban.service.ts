import { type Guild, type GuildMember, EmbedBuilder } from "discord.js";
import {
  addVoiceBan,
  removeVoiceBan,
  isVoiceBanned,
  listVoiceBans,
  clearAllVoiceBans,
} from "@aegisx/database";
import { dispatchLog } from "../logging/audit-logger.service.js";
import { AegisColors } from "../../utils/ui/colors.js";

export class VcBanService {
  /**
   * Voice bans a member: saves persistent record and disconnects from active VC
   */
  async banMemberFromVoice(
    guild: Guild,
    target: GuildMember,
    moderator: { id: string; tag: string },
    reason = "Voice channel isolation / Boycott",
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await addVoiceBan({
        guildId: guild.id,
        userId: target.id,
        moderatorId: moderator.id,
        reason,
      });

      // Disconnect member if currently in voice
      if (target.voice?.channel) {
        await target.voice.disconnect(`Voice Banned: ${reason}`).catch(() => {});
      }

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Danger)
        .setTitle("🚫 Member Voice Banned (Boycott)")
        .setDescription(
          `**Target:** <@${target.id}> (\`${target.user.tag}\`)\n` +
          `**Moderator:** <@${moderator.id}>\n` +
          `**Reason:** ${reason}`,
        )
        .setTimestamp();

      await dispatchLog(guild, "voice", embed);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  /**
   * Unbans a member from voice
   */
  async unbanMemberFromVoice(
    guild: Guild,
    userId: string,
    moderator: { id: string; tag: string },
    reason = "Manual staff voice unban",
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const removed = await removeVoiceBan(guild.id, userId);
      if (!removed) return { success: false, error: "Member is not voice banned." };

      const embed = new EmbedBuilder()
        .setColor(AegisColors.Success)
        .setTitle("🔊 Member Voice Unbanned")
        .setDescription(
          `**Target:** <@${userId}>\n` +
          `**Moderator:** <@${moderator.id}>\n` +
          `**Reason:** ${reason}`,
        )
        .setTimestamp();

      await dispatchLog(guild, "voice", embed);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  /**
   * Enforces voice ban when a user joins or switches VC
   */
  async handleVoiceConnect(member: GuildMember): Promise<boolean> {
    const banned = await isVoiceBanned(member.guild.id, member.id);
    if (banned && member.voice?.channel) {
      await member.voice.disconnect("AegisX Voice Ban Active").catch(() => {});
      return true;
    }
    return false;
  }

  async getBans(guildId: string) {
    return listVoiceBans(guildId);
  }

  async clearBans(guildId: string) {
    return clearAllVoiceBans(guildId);
  }
}

export const vcBanService = new VcBanService();
