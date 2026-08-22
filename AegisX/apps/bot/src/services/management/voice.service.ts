import {
  type VoiceState,
  type VoiceChannel,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";
import { AegisColors } from "../../utils/ui/colors.js";

// In-memory active temporary channel map
export const tempVoiceMap = new Map<string, { ownerId: string; guildId: string }>();

export class VoiceService {
  buildVoiceControlPanel(channelName: string, ownerTag: string): {
    embed: EmbedBuilder;
    row1: ActionRowBuilder<ButtonBuilder>;
    row2: ActionRowBuilder<ButtonBuilder>;
  } {
    const embed = new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle(`🔊 Voice Room Control • ${channelName}`)
      .setDescription(
        `Welcome to your dynamic temporary voice room!\n` +
        `**Owner:** \`${ownerTag}\`\n\n` +
        `Use the buttons below to control access, privacy, and room capacity.`,
      )
      .setFooter({ text: "AegisX Voice Master • Auto-deletes when empty" });

    const btnLock = new ButtonBuilder()
      .setCustomId("aegis_vc_lock")
      .setLabel("Lock")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger);

    const btnUnlock = new ButtonBuilder()
      .setCustomId("aegis_vc_unlock")
      .setLabel("Unlock")
      .setEmoji("🔓")
      .setStyle(ButtonStyle.Success);

    const btnHide = new ButtonBuilder()
      .setCustomId("aegis_vc_hide")
      .setLabel("Hide")
      .setEmoji("👁️")
      .setStyle(ButtonStyle.Secondary);

    const btnUnhide = new ButtonBuilder()
      .setCustomId("aegis_vc_unhide")
      .setLabel("Unhide")
      .setEmoji("👀")
      .setStyle(ButtonStyle.Secondary);

    const btnLimit = new ButtonBuilder()
      .setCustomId("aegis_vc_limit")
      .setLabel("Limit")
      .setEmoji("👥")
      .setStyle(ButtonStyle.Primary);

    const btnClaim = new ButtonBuilder()
      .setCustomId("aegis_vc_claim")
      .setLabel("Claim")
      .setEmoji("👑")
      .setStyle(ButtonStyle.Primary);

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(btnLock, btnUnlock, btnHide, btnUnhide);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(btnLimit, btnClaim);

    return { embed, row1, row2 };
  }

  async handleVoiceState(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const guild = newState.guild;
    const config = await getGuildConfig(guild.id);
    const j2cConfig = config.j2c;

    // 1. User Joined J2C Hub Channel -> Spawn Temp VC
    if (
      j2cConfig &&
      j2cConfig.enabled &&
      newState.channelId === j2cConfig.hubChannelId &&
      newState.member
    ) {
      const member = newState.member;
      const channelName = `${member.user.displayName}'s Room`;

      const tempChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: j2cConfig.categoryId || newState.channel?.parentId || undefined,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
            ],
          },
        ],
      });

      tempVoiceMap.set(tempChannel.id, { ownerId: member.id, guildId: guild.id });
      await member.voice.setChannel(tempChannel).catch(() => {});

      // Send Control Panel into the voice text chat
      const { embed, row1, row2 } = this.buildVoiceControlPanel(channelName, member.user.tag);
      await tempChannel.send({ embeds: [embed], components: [row1, row2] }).catch(() => {});
    }

    // 2. User Left a Temp Channel -> Delete if empty
    if (oldState.channelId && tempVoiceMap.has(oldState.channelId)) {
      const channel = oldState.channel;
      if (channel && channel.members.size === 0) {
        tempVoiceMap.delete(oldState.channelId);
        await channel.delete("Empty temporary voice room").catch(() => {});
      }
    }
  }
}

export const voiceService = new VoiceService();
