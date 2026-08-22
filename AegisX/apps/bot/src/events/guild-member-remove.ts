import {
  AuditLogEvent,
  type GuildMember,
  type PartialGuildMember,
} from "discord.js";
import { antiNukeService } from "../security/antinuke/index.js";

export async function handleGuildMemberRemove(
  member: GuildMember | PartialGuildMember,
): Promise<void> {
  try {
    // Check for MemberKick
    await antiNukeService.handle(member.guild, {
      eventName: "memberKick",
      action: AuditLogEvent.MemberKick,
      targetId: member.id,
      actionType: "kick",
      immediatePunish: true,
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke member remove handler failed in guild ${member.guild.id}:`,
      error,
    );
  }
}
