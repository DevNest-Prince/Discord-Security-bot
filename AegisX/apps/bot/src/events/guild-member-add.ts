import {
  AuditLogEvent,
  type GuildMember,
} from "discord.js";
import { antiNukeService, recoveryService } from "../security/antinuke/index.js";

export async function handleGuildMemberAdd(
  member: GuildMember,
): Promise<void> {
  // Only process if joined member is a BOT
  if (!member.user.bot) return;

  try {
    await antiNukeService.handle(member.guild, {
      eventName: "botAdd",
      action: AuditLogEvent.BotAdd,
      targetId: member.id,
      actionType: "botadd",
      immediatePunish: true,
      onRecover: async () => {
        await recoveryService.kickRogueBot(
          member.guild,
          member.id,
          "Anti-Nuke: Kicking unauthorized bot",
        );
      },
    });
  } catch (error) {
    console.error(
      `❌ Anti-Nuke bot add handler failed in guild ${member.guild.id}:`,
      error,
    );
  }
}
