import {
  AuditLogEvent,
  type GuildMember,
  type PartialGuildMember,
  EmbedBuilder,
} from "discord.js";
import { antiNukeService } from "../security/antinuke/index.js";
import { goodbyeService } from "../services/management/goodbye.service.js";
import { dispatchLog } from "../services/logging/audit-logger.service.js";
import { AegisColors } from "../utils/ui/colors.js";

export async function handleGuildMemberRemove(
  member: GuildMember | PartialGuildMember,
): Promise<void> {
  const guild = member.guild;

  // 1. Goodbye Announcement
  try {
    if ("user" in member && member.user) {
      await goodbyeService.handleMemberLeave(member as GuildMember);
    }
  } catch (err) {
    console.error(`[MemberRemove] Goodbye error in ${guild.id}:`, err);
  }

  // 2. Member Leave Audit Log
  try {
    const userTag = "user" in member && member.user ? member.user.tag : member.id;
    const logEmbed = new EmbedBuilder()
      .setColor(AegisColors.Warning)
      .setTitle("📤 Member Left")
      .setDescription(
        `**User:** <@${member.id}> (\`${userTag}\`)\n` +
        `**ID:** \`${member.id}\`\n` +
        `**Remaining Members:** \`${guild.memberCount}\``,
      )
      .setTimestamp();
    await dispatchLog(guild, "members", logEmbed);
  } catch {}

  // 3. Anti-Kick Anti-Nuke Detection
  try {
    await antiNukeService.handle(guild, {
      eventName: "memberKick",
      action: AuditLogEvent.MemberKick,
      targetId: member.id,
      actionType: "kick",
      immediatePunish: true,
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke member remove handler failed in guild ${guild.id}:`,
      error,
    );
  }
}
