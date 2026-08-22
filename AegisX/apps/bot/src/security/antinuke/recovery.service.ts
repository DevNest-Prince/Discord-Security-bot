import {
  type Guild,
  type GuildChannel,
  type Role,
  type GuildMember,
  ChannelType,
  PermissionsBitField,
  PermissionFlagsBits,
} from "discord.js";

export interface ChannelSnapshot {
  name: string;
  type: ChannelType;
  topic?: string | null;
  nsfw?: boolean;
  bitrate?: number;
  userLimit?: number;
  parentId?: string | null;
  position?: number;
  permissionOverwrites?: Array<{
    id: string;
    type: number;
    allow: bigint;
    deny: bigint;
  }>;
}

export interface RoleSnapshot {
  name: string;
  color: number;
  hoist: boolean;
  position?: number;
  permissions: bigint;
  mentionable: boolean;
}

export class RecoveryService {
  /**
   * Reverts an unauthorized ban by unbanning the victim.
   */
  async revertBan(guild: Guild, targetUserId: string, reason: string): Promise<boolean> {
    try {
      await guild.bans.remove(targetUserId, reason);
      console.log(`🔄 [Recovery] Successfully unbanned victim ${targetUserId} in ${guild.name}`);
      return true;
    } catch (error: any) {
      console.error(`⚠️ [Recovery] Failed to unban victim ${targetUserId}:`, error?.message ?? error);
      return false;
    }
  }

  /**
   * Kicks a rogue bot added by an unwhitelisted user.
   */
  async kickRogueBot(guild: Guild, botUserId: string, reason: string): Promise<boolean> {
    try {
      const botMember = await guild.members.fetch(botUserId).catch(() => null);
      if (botMember && botMember.user.bot) {
        await botMember.kick(reason);
        console.log(`🔄 [Recovery] Successfully kicked unauthorized bot ${botMember.user.tag} from ${guild.name}`);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error(`⚠️ [Recovery] Failed to kick bot ${botUserId}:`, error?.message ?? error);
      return false;
    }
  }

  /**
   * Deletes an unauthorized created channel.
   */
  async deleteRogueChannel(channel: GuildChannel, reason: string): Promise<boolean> {
    try {
      if (channel.deletable) {
        await channel.delete(reason);
        console.log(`🔄 [Recovery] Deleted unauthorized channel ${channel.name} (${channel.id})`);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error(`⚠️ [Recovery] Failed to delete rogue channel:`, error?.message ?? error);
      return false;
    }
  }

  /**
   * Recreates a deleted channel with its original settings.
   */
  async recreateDeletedChannel(guild: Guild, snapshot: ChannelSnapshot, reason: string): Promise<GuildChannel | null> {
    try {
      if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return null;
      }

      const created = await guild.channels.create({
        name: snapshot.name,
        type: snapshot.type as any,
        topic: snapshot.topic ?? undefined,
        nsfw: snapshot.nsfw,
        bitrate: snapshot.bitrate,
        userLimit: snapshot.userLimit,
        parent: snapshot.parentId ?? undefined,
        position: snapshot.position,
        permissionOverwrites: snapshot.permissionOverwrites?.map((ow) => ({
          id: ow.id,
          type: ow.type,
          allow: new PermissionsBitField(ow.allow),
          deny: new PermissionsBitField(ow.deny),
        })),
        reason,
      });

      console.log(`🔄 [Recovery] Recreated deleted channel ${created.name} (${created.id})`);
      return created as GuildChannel;
    } catch (error: any) {
      console.error(`⚠️ [Recovery] Failed to recreate channel ${snapshot.name}:`, error?.message ?? error);
      return null;
    }
  }

  /**
   * Deletes an unauthorized created role.
   */
  async deleteRogueRole(role: Role, reason: string): Promise<boolean> {
    try {
      if (role.editable && !role.managed) {
        await role.delete(reason);
        console.log(`🔄 [Recovery] Deleted unauthorized role ${role.name} (${role.id})`);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error(`⚠️ [Recovery] Failed to delete rogue role:`, error?.message ?? error);
      return false;
    }
  }

  /**
   * Recreates a deleted role with its original settings.
   */
  async recreateDeletedRole(guild: Guild, snapshot: RoleSnapshot, reason: string): Promise<Role | null> {
    try {
      if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return null;
      }

      const created = await guild.roles.create({
        name: snapshot.name,
        color: snapshot.color,
        hoist: snapshot.hoist,
        permissions: new PermissionsBitField(snapshot.permissions),
        mentionable: snapshot.mentionable,
        position: snapshot.position,
        reason,
      });

      console.log(`🔄 [Recovery] Recreated deleted role ${created.name} (${created.id})`);
      return created;
    } catch (error: any) {
      console.error(`⚠️ [Recovery] Failed to recreate role ${snapshot.name}:`, error?.message ?? error);
      return null;
    }
  }

  /**
   * Strips dangerous permissions (Admin, Ban, Kick, Manage Server, Manage Roles, Manage Channels, Manage Webhooks, Mention Everyone) from a role.
   */
  async stripDangerousPermissions(role: Role, reason: string): Promise<boolean> {
    try {
      if (!role.editable) return false;

      const dangerousFlags = [
        PermissionFlagsBits.Administrator,
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.ManageGuild,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageWebhooks,
        PermissionFlagsBits.MentionEveryone,
      ];

      const safePermissions = new PermissionsBitField(role.permissions).remove(...dangerousFlags);
      await role.setPermissions(safePermissions, reason);
      console.log(`🔄 [Recovery] Stripped dangerous permissions from role ${role.name} (${role.id})`);
      return true;
    } catch (error: any) {
      console.error(`⚠️ [Recovery] Failed to strip dangerous perms from role:`, error?.message ?? error);
      return false;
    }
  }

  /**
   * Strips specific dangerous role from a member.
   */
  async removeDangerousRoleFromMember(member: GuildMember, role: Role, reason: string): Promise<boolean> {
    try {
      if (role.editable && member.roles.cache.has(role.id)) {
        await member.roles.remove(role, reason);
        console.log(`🔄 [Recovery] Removed dangerous role ${role.name} from member ${member.user.tag}`);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error(`⚠️ [Recovery] Failed to remove dangerous role from member:`, error?.message ?? error);
      return false;
    }
  }
}

export const recoveryService = new RecoveryService();
