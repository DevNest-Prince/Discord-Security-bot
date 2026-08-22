import {
  type GuildMember,
  type User,
  type TextChannel,
  EmbedBuilder,
} from "discord.js";
import { getGuildConfig, type GoodbyeConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

export class GoodbyeService {
  parseVariables(template: string, member: GuildMember | User, guildName: string, memberCount: number): string {
    const user = "user" in member ? member.user : member;
    return template
      .replace(/{user}/g, `<@${user.id}>`)
      .replace(/{username}/g, user.username)
      .replace(/{server}/g, guildName)
      .replace(/{memberCount}/g, memberCount.toString())
      .replace(/{avatar}/g, user.displayAvatarURL())
      .replace(/{createdAt}/g, `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`);
  }

  async handleMemberLeave(member: GuildMember): Promise<void> {
    const config = await getGuildConfig(member.guild.id);
    const goodbye = config.goodbye;

    if (!goodbye || !goodbye.enabled || !goodbye.channelId) return;

    const channel = member.guild.channels.cache.get(goodbye.channelId) as TextChannel | undefined;
    if (!channel || !channel.isTextBased()) return;

    const rawMessage = goodbye.message || "👋 Goodbye **{username}**! We are now at **{memberCount}** members.";
    const parsedText = this.parseVariables(
      rawMessage,
      member,
      member.guild.name,
      member.guild.memberCount,
    );

    if (goodbye.embedData) {
      const embed = new EmbedBuilder()
        .setColor((goodbye.embedData.color as number) || AegisColors.Dark)
        .setTitle((goodbye.embedData.title as string) || `Member Left • ${member.guild.name}`)
        .setDescription(parsedText)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: `Member #${member.guild.memberCount}` })
        .setTimestamp();

      const sent = await channel.send({ embeds: [embed] }).catch(() => null);
      if (sent && goodbye.autoDeleteDuration && goodbye.autoDeleteDuration > 0) {
        setTimeout(() => sent.delete().catch(() => {}), goodbye.autoDeleteDuration * 1000);
      }
    } else {
      const sent = await channel.send({ content: parsedText }).catch(() => null);
      if (sent && goodbye.autoDeleteDuration && goodbye.autoDeleteDuration > 0) {
        setTimeout(() => sent.delete().catch(() => {}), goodbye.autoDeleteDuration * 1000);
      }
    }
  }
}

export const goodbyeService = new GoodbyeService();
