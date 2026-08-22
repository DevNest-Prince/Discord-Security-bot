import {
  type Guild,
  type GuildMember,
  type User,
  PermissionFlagsBits,
} from "discord.js";
import {
  getGuildConfig,
  getHighestStaffPriorityForUser,
  type StaffPermissionProfile,
} from "@aegisx/database";

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  staffProfile?: StaffPermissionProfile | null;
}

export class PermissionGuardService {
  /**
   * Evaluates whether a member has internal authority to execute a given module/command/action.
   */
  async canExecute(
    member: GuildMember,
    requiredPermission: {
      module?: string;
      command?: string;
      action?: string;
      discordFallback?: bigint;
    },
  ): Promise<PermissionCheckResult> {
    const guild = member.guild;

    // 1. Server Owner always has absolute authority
    if (member.id === guild.ownerId) {
      return { allowed: true, reason: "Server Owner" };
    }

    // 2. Extra Owners configured in AntiNuke / Security
    const config = await getGuildConfig(guild.id);
    const extraOwners = config.security?.extraOwners || [];
    if (extraOwners.includes(member.id)) {
      return { allowed: true, reason: "Appointed Extra Owner" };
    }

    // 3. Check internal Staff Permission Profiles
    const roleIds = Array.from(member.roles.cache.keys());
    const profile = await getHighestStaffPriorityForUser(guild.id, roleIds);

    if (profile) {
      // Check module grant
      if (
        requiredPermission.module &&
        profile.allowedModules.includes(requiredPermission.module)
      ) {
        return { allowed: true, staffProfile: profile, reason: `Granted by ${profile.name}` };
      }

      // Check specific command grant
      if (
        requiredPermission.command &&
        profile.allowedCommands.includes(requiredPermission.command)
      ) {
        return { allowed: true, staffProfile: profile, reason: `Granted by ${profile.name}` };
      }

      // Check specific action grant
      if (
        requiredPermission.action &&
        profile.allowedActions.includes(requiredPermission.action)
      ) {
        return { allowed: true, staffProfile: profile, reason: `Granted by ${profile.name}` };
      }
    }

    // 4. Native Discord Permission Fallback (if configured and member has native rights)
    if (requiredPermission.discordFallback) {
      if (member.permissions.has(requiredPermission.discordFallback)) {
        return { allowed: true, reason: "Native Discord Permission" };
      }
    } else if (member.permissions.has(PermissionFlagsBits.Administrator)) {
      return { allowed: true, reason: "Administrator" };
    }

    return {
      allowed: false,
      reason: `You lack the internal bot staff role or Discord permission required for this action.`,
    };
  }

  /**
   * Validates target hierarchy. A moderator cannot act on the server owner,
   * extra owners, bot, or equal/higher internal staff members.
   */
  async canModerateTarget(
    moderator: GuildMember,
    target: GuildMember | User,
  ): Promise<{ canModerate: boolean; reason?: string }> {
    const guild = moderator.guild;
    const targetId = target.id;

    // Cannot moderate self
    if (moderator.id === targetId) {
      return { canModerate: false, reason: "You cannot execute moderation actions on yourself." };
    }

    // Cannot moderate Guild Owner
    if (targetId === guild.ownerId) {
      return { canModerate: false, reason: "You cannot moderate the Server Owner." };
    }

    // Cannot moderate Bot
    if (targetId === guild.client.user?.id) {
      return { canModerate: false, reason: "You cannot execute moderation actions on AegisX." };
    }

    // Moderator is Server Owner -> Can moderate anyone
    if (moderator.id === guild.ownerId) {
      return { canModerate: true };
    }

    // Target is Extra Owner
    const config = await getGuildConfig(guild.id);
    const extraOwners = config.security?.extraOwners || [];
    if (extraOwners.includes(targetId)) {
      return { canModerate: false, reason: "You cannot moderate an appointed Extra Owner." };
    }

    // If target is in the guild as a member, check Discord role position & internal staff priority
    if ("roles" in target && target.roles?.highest) {
      // Discord native role position check
      if (
        target.roles.highest.position >= moderator.roles.highest.position &&
        moderator.id !== guild.ownerId
      ) {
        return {
          canModerate: false,
          reason: "Target member has equal or higher Discord role hierarchy than you.",
        };
      }

      // Internal staff priority check
      const modRoles = Array.from(moderator.roles.cache.keys());
      const targetRoles = Array.from(target.roles.cache.keys());

      const modProfile = await getHighestStaffPriorityForUser(guild.id, modRoles);
      const targetProfile = await getHighestStaffPriorityForUser(guild.id, targetRoles);

      if (targetProfile && modProfile) {
        if (targetProfile.priority >= modProfile.priority) {
          return {
            canModerate: false,
            reason: `Target has equal or higher staff tier (${targetProfile.name}) than your staff tier (${modProfile.name}).`,
          };
        }
      }
    }

    return { canModerate: true };
  }
}

export const permissionGuard = new PermissionGuardService();
