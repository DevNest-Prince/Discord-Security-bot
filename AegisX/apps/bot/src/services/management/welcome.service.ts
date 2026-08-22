import {
  type GuildMember,
  EmbedBuilder,
  type TextChannel,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export function formatWelcomeString(template: string, member: GuildMember): string {
  return template
    .replace(/{user}/g, `<@${member.id}>`)
    .replace(/{user.name}/g, member.user.username)
    .replace(/{user.tag}/g, member.user.tag)
    .replace(/{user.id}/g, member.id)
    .replace(/{user.mention}/g, `<@${member.id}>`)
    .replace(/{server}/g, member.guild.name)
    .replace(/{server.name}/g, member.guild.name)
    .replace(/{server.member_count}/g, member.guild.memberCount.toString())
    .replace(/{server.count}/g, member.guild.memberCount.toString());
}

export async function handleWelcome(member: GuildMember): Promise<void> {
  const config = await getGuildConfig(member.guild.id);
  const welcome = config.welcome;

  if (!welcome || !welcome.channelId) return;

  const channel = member.guild.channels.cache.get(welcome.channelId) as TextChannel | undefined;
  if (!channel || !channel.isTextBased()) return;

  const defaultMsg = `👋 Welcome {user} to **{server.name}**! You are member **#{server.member_count}**.`;
  const rawMsg = welcome.welcomeMessage || defaultMsg;
  const formattedContent = formatWelcomeString(rawMsg, member);

  let embed: EmbedBuilder | undefined;
  if (welcome.welcomeType === "embed" || welcome.embedData) {
    embed = new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle(`Welcome to ${member.guild.name}! 🎉`)
      .setDescription(formattedContent)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setFooter({ text: `Member #${member.guild.memberCount}` })
      .setTimestamp();
  }

  try {
    const sentMsg = await channel.send({
      content: welcome.welcomeType === "embed" ? undefined : formattedContent,
      embeds: embed ? [embed] : undefined,
    });

    if (welcome.autoDeleteDuration && welcome.autoDeleteDuration > 0) {
      setTimeout(() => {
        sentMsg.delete().catch(() => {});
      }, welcome.autoDeleteDuration * 1000);
    }
  } catch (err) {
    console.error(`[Welcome] Failed to send welcome message in ${member.guild.id}:`, err);
  }
}

export async function handleJoinDm(member: GuildMember): Promise<void> {
  const config = await getGuildConfig(member.guild.id);
  const joinDm = config.joinDm;

  if (!joinDm || !joinDm.enabled || !joinDm.message) return;

  const formattedContent = formatWelcomeString(joinDm.message, member);
  try {
    await member.send(formattedContent);
  } catch {
    // User may have DMs disabled; ignore safely
  }
}
