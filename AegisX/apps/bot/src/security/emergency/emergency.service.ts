import {
  type Guild,
  type TextChannel,
  type VoiceChannel,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import {
  getGuildConfig,
  updateEmergencyConfig,
  type ChannelSnapshotData,
} from "@aegisx/database";
import { deleteGuildConfigCache } from "@aegisx/redis";

export class EmergencyService {
  /**
   * Quarantines the server: Locks down all text & voice channels for @everyone,
   * saving a full snapshot of pre-emergency permission overwrites.
   */
  async lockdown(guild: Guild, reason: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const everyoneRole = guild.roles.everyone;
      const channels = guild.channels.cache.filter((ch) => !ch.isDMBased());

      const snapshots: ChannelSnapshotData[] = [];
      const lockedChannels: string[] = [];

      for (const [channelId, channel] of channels) {
        if (!("permissionOverwrites" in channel)) continue;

        // Save snapshot of existing overwrites
        const currentOverwrites = channel.permissionOverwrites.cache.map((ow) => ({
          id: ow.id,
          type: ow.type,
          allow: ow.allow.bitfield.toString(),
          deny: ow.deny.bitfield.toString(),
        }));

        snapshots.push({
          channelId,
          overwrites: currentOverwrites,
        });

        // Apply lockdown to @everyone role
        try {
          if (channel.isTextBased() && "permissionOverwrites" in channel) {
            await (channel as TextChannel).permissionOverwrites.edit(everyoneRole, {
              SendMessages: false,
              AddReactions: false,
              CreatePublicThreads: false,
              CreatePrivateThreads: false,
              SendMessagesInThreads: false,
            }, { reason });
            lockedChannels.push(channelId);
          } else if (channel.isVoiceBased() && "permissionOverwrites" in channel) {
            await (channel as VoiceChannel).permissionOverwrites.edit(everyoneRole, {
              Connect: false,
              Speak: false,
            }, { reason });
            lockedChannels.push(channelId);
          }
        } catch (editErr) {
          // Continue locking remaining channels if one fails
        }
      }

      await updateEmergencyConfig(guild.id, {
        enabled: true,
        lockedChannels,
        snapshot: snapshots,
      });

      await deleteGuildConfigCache(guild.id);
      console.log(`🚨 [Emergency] Quarantined ${lockedChannels.length} channels in ${guild.name} (${guild.id})`);

      return { success: true, count: lockedChannels.length };
    } catch (err: any) {
      console.error(`❌ [Emergency] Lockdown failed in guild ${guild.id}:`, err);
      return { success: false, count: 0, error: err?.message };
    }
  }

  /**
   * Restores all channels to their original permission overwrites.
   */
  async unlockdown(guild: Guild, reason: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const config = await getGuildConfig(guild.id);
      const snapshots = config.emergency?.snapshot ?? [];

      let restoredCount = 0;

      for (const snap of snapshots) {
        const channel = guild.channels.cache.get(snap.channelId);
        if (!channel || !("permissionOverwrites" in channel)) continue;

        try {
          // Reconstruct and overwrite permissions
          const overwrites = snap.overwrites.map((ow) => ({
            id: ow.id,
            type: ow.type,
            allow: new PermissionsBitField(BigInt(ow.allow)),
            deny: new PermissionsBitField(BigInt(ow.deny)),
          }));

          await (channel as any).permissionOverwrites.set(overwrites, reason);
          restoredCount++;
        } catch (restoreErr) {
          // Continue restoring remaining channels
        }
      }

      await updateEmergencyConfig(guild.id, {
        enabled: false,
        lockedChannels: [],
        snapshot: [],
      });

      await deleteGuildConfigCache(guild.id);
      console.log(`✅ [Emergency] Restored ${restoredCount} channels in ${guild.name} (${guild.id})`);

      return { success: true, count: restoredCount };
    } catch (err: any) {
      console.error(`❌ [Emergency] Restore failed in guild ${guild.id}:`, err);
      return { success: false, count: 0, error: err?.message };
    }
  }

  async enableEmergency(guild: Guild, reason = "Server Emergency Lockdown"): Promise<number> {
    const res = await this.lockdown(guild, reason);
    return res.count;
  }

  async disableEmergency(guild: Guild, reason = "Lifting Emergency Lockdown"): Promise<number> {
    const res = await this.unlockdown(guild, reason);
    return res.count;
  }
}

export const emergencyService = new EmergencyService();

