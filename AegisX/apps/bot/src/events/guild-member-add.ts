import {
  AuditLogEvent,
  type GuildMember,
  EmbedBuilder,
} from "discord.js";
import { antiNukeService, recoveryService } from "../security/antinuke/index.js";
import {
  handleWelcome,
  handleJoinDm,
} from "../services/management/welcome.service.js";
import { handleAutoRole as applyAutoRole } from "../services/management/autorole.service.js";

import { dispatchLog } from "../services/management/logging.service.js";
import { AegisColors } from "../utils/ui/colors.js";

export async function handleGuildMemberAdd(
  member: GuildMember,
): Promise<void> {
  // 1. Welcome Greeting & Join DM
  try {
    await handleWelcome(member);
    await handleJoinDm(member);
  } catch (err) {
    console.error(`[MemberAdd] Welcome error in ${member.guild.id}:`, err);
  }

  // 2. AutoRole Assignment
  try {
    await applyAutoRole(member);
  } catch (err) {
    console.error(`[MemberAdd] AutoRole error in ${member.guild.id}:`, err);
  }

  // 3. Member Join Audit Log
  try {
    const logEmbed = new EmbedBuilder()
      .setColor(AegisColors.Success)
      .setTitle("📥 Member Joined")
      .setDescription(`**User:** <@${member.id}> (${member.user.tag})\n**ID:** \`${member.id}\`\n**Account Created:** <t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>\n**Total Members:** \`${member.guild.memberCount}\``)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();
    await dispatchLog(member.guild, "members", logEmbed);
  } catch {}

  // 4. Anti-Bot Add Protection (If member is a bot)
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

