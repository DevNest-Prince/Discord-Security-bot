import {
  PermissionFlagsBits,
} from "discord.js";
import type {
  Guild,
  GuildMember,
} from "discord.js";

export type EnforcementAction =
  | "ban"
  | "kick"
  | "strip_roles";

export interface EnforcementRequest {
  guild: Guild;
  executorId: string;
  action: EnforcementAction;
  reason: string;
  dryRun?: boolean;
}

export interface EnforcementResult {
  success: boolean;
  executed: boolean;
  action: EnforcementAction;
  reason: string;
}

export class EnforcementService {
  async execute(
    request: EnforcementRequest,
  ): Promise<EnforcementResult> {
    const {
      guild,
      executorId,
      action,
      reason,
      dryRun = true,
    } = request;

    const member =
      await guild.members.fetch(executorId).catch(() => null);

    if (!member) {
      return this.fail(
        action,
        "Executor could not be resolved.",
      );
    }

const me = guild.members.me;

if (!me) {
  return this.fail(
    action,
    "Bot member could not be resolved.",
  );
}

const requiredPermission =
  action === "ban"
    ? PermissionFlagsBits.BanMembers
    : action === "kick"
      ? PermissionFlagsBits.KickMembers
      : PermissionFlagsBits.ManageRoles;

if (!me.permissions.has(requiredPermission)) {
  return this.fail(
    action,
    `Bot is missing required permission for ${action}.`,
  );
}

    if (member.id === guild.ownerId) {
      return this.fail(
        action,
        "Cannot enforce against the server owner.",
      );
    }

    if (member.id === me.id) {
      return this.fail(
        action,
        "Cannot enforce against the bot itself.",
      );
    }

    if (
      member.roles.highest.comparePositionTo(
        me.roles.highest,
      ) >= 0
    ) {
      return this.fail(
        action,
        "Executor role is equal to or higher than the bot.",
      );
    }

    if (dryRun) {
      console.warn(
        `DRY RUN: ${action} ${member.user.tag} (${member.id})`,
        {
          guildId: guild.id,
          reason,
        },
      );

      return {
        success: true,
        executed: false,
        action,
        reason,
      };
    }

    try {
      switch (action) {
        case "ban":
          await member.ban({ reason });
          break;

        case "kick":
          await member.kick(reason);
          break;

        case "strip_roles":
          await this.stripRoles(member, reason);
          break;
      }

      return {
        success: true,
        executed: true,
        action,
        reason,
      };
    } catch (error) {
      console.error(
        `Enforcement failed for ${member.id}:`,
        error,
      );

      return {
        success: false,
        executed: false,
        action,
        reason,
      };
    }
  }

  private async stripRoles(
    member: GuildMember,
    reason: string,
  ): Promise<void> {
    const removableRoles = member.roles.cache.filter(
      (role) =>
        role.editable &&
        !role.managed,
    );

    if (removableRoles.size === 0) {
      return;
    }

    await member.roles.remove(
      removableRoles,
      reason,
    );
  }

  private fail(
    action: EnforcementAction,
    reason: string,
  ): EnforcementResult {
    console.warn(
      `Enforcement blocked: ${reason}`,
    );

    return {
      success: false,
      executed: false,
      action,
      reason,
    };
  }
}

export const enforcementService =
  new EnforcementService();
