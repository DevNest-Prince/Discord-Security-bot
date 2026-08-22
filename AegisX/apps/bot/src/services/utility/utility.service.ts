import { type Guild, type GuildMember, EmbedBuilder, type User } from "discord.js";
import { AegisColors } from "../../utils/ui/colors.js";

export class UtilityService {
  buildServerInfo(guild: Guild): EmbedBuilder {
    const textCount = guild.channels.cache.filter((c) => c.isTextBased()).size;
    const voiceCount = guild.channels.cache.filter((c) => c.isVoiceBased()).size;
    const roleCount = guild.roles.cache.size;
    const emojiCount = guild.emojis.cache.size;

    return new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle(`📊 Server Analytics • ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }) || null)
      .addFields(
        { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "👥 Members", value: `\`${guild.memberCount}\``, inline: true },
        { name: "✨ Boost Tier", value: `Tier \`${guild.premiumTier}\` (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
        { name: "💬 Channels", value: `\`${textCount}\` Text | \`${voiceCount}\` Voice`, inline: true },
        { name: "🎭 Roles", value: `\`${roleCount}\` roles`, inline: true },
        { name: "😀 Emojis", value: `\`${emojiCount}\` emojis`, inline: true },
        { name: "📅 Created At", value: `<t:${Math.floor(guild.createdAt.getTime() / 1000)}:R>`, inline: true },
        { name: "🆔 Guild ID", value: `\`${guild.id}\``, inline: true },
      )
      .setFooter({ text: "AegisX Server Analytics" })
      .setTimestamp();
  }

  buildUserInfo(member: GuildMember): EmbedBuilder {
    const roles = member.roles.cache
      .filter((r) => r.id !== member.guild.id)
      .map((r) => `<@&${r.id}>`)
      .slice(0, 15);

    return new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle(`👤 User Profile • ${member.user.tag}`)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🆔 User ID", value: `\`${member.id}\``, inline: true },
        { name: "🤖 Bot Account", value: member.user.bot ? "`Yes`" : "`No`", inline: true },
        { name: "📅 Account Created", value: `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>`, inline: true },
        { name: "📥 Joined Server", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "`Unknown`", inline: true },
        { name: "🛡️ Highest Role", value: `<@&${member.roles.highest.id}>`, inline: true },
        { name: `🎭 Roles (${member.roles.cache.size - 1})`, value: roles.length > 0 ? roles.join(", ") : "*None*" },
      )
      .setTimestamp();
  }

  buildAvatarEmbed(user: User): EmbedBuilder {
    const avatarUrl = user.displayAvatarURL({ size: 1024 });
    return new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle(`🖼️ Avatar • ${user.tag}`)
      .setImage(avatarUrl)
      .setDescription(`[Direct Link](${avatarUrl})`)
      .setTimestamp();
  }

  buildBannerEmbed(user: User): EmbedBuilder {
    const bannerUrl = user.bannerURL({ size: 1024 });
    if (!bannerUrl) {
      return new EmbedBuilder()
        .setColor(AegisColors.Dark)
        .setTitle(`🖼️ Banner • ${user.tag}`)
        .setDescription("*This user has not set a custom banner.*");
    }
    return new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle(`🖼️ Banner • ${user.tag}`)
      .setImage(bannerUrl)
      .setDescription(`[Direct Link](${bannerUrl})`)
      .setTimestamp();
  }
}

export const utilityService = new UtilityService();
