import {
  type VoiceState,
  ChannelType,
  PermissionsBitField,
} from "discord.js";
import { getGuildConfig } from "@aegisx/database";

const tempVoiceChannels = new Set<string>();

export async function handleVoiceStateJ2C(
  oldState: VoiceState,
  newState: VoiceState,
): Promise<void> {
  const guild = newState.guild || oldState.guild;
  if (!guild) return;

  const config = await getGuildConfig(guild.id);
  const j2c = config.j2c;
  const inVcRole = config.inVcRole;

  // 1. In-VC Role Handler
  if (inVcRole && inVcRole.enabled && inVcRole.roleId) {
    const role = guild.roles.cache.get(inVcRole.roleId);
    const member = newState.member || oldState.member;
    if (role && member && !member.user.bot) {
      if (newState.channelId && !oldState.channelId) {
        // User joined voice
        await member.roles.add(role, "AegisX In-VC Role: Joined Voice Channel").catch(() => {});
      } else if (!newState.channelId && oldState.channelId) {
        // User left voice
        await member.roles.remove(role, "AegisX In-VC Role: Left Voice Channel").catch(() => {});
      }
    }
  }

  // 2. Join to Create (J2C) Hub Handler
  if (j2c && j2c.enabled && j2c.hubChannelId && newState.channelId === j2c.hubChannelId && newState.member) {
    const member = newState.member;
    const channelName = (j2c.defaultName || "🔊 {user}'s Room").replace(/{user}/g, member.displayName);

    try {
      const createdVoice = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: j2c.categoryId || undefined,
        userLimit: j2c.defaultLimit || 0,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.MoveMembers,
              PermissionsBitField.Flags.MuteMembers,
              PermissionsBitField.Flags.DeafenMembers,
            ],
          },
        ],
      });

      tempVoiceChannels.add(createdVoice.id);
      await member.voice.setChannel(createdVoice);
    } catch (err) {
      console.error(`[J2C] Failed to create dynamic voice channel in ${guild.id}:`, err);
    }
  }

  // 3. Delete empty temporary voice channels
  if (oldState.channelId && tempVoiceChannels.has(oldState.channelId)) {
    const oldChan = guild.channels.cache.get(oldState.channelId);
    if (oldChan && oldChan.isVoiceBased() && oldChan.members.size === 0) {
      tempVoiceChannels.delete(oldState.channelId);
      try {
        await oldChan.delete();
      } catch {}
    }
  }
}
