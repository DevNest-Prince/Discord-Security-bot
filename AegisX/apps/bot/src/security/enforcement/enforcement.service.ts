import {
  PermissionFlagsBits,
  type Guild,
  type GuildMember,
} from "discord.js";

export type EnforcementAction =
  | "ban"
  | "kick"
  | "strip_roles"
  | "timeout";

export interface EnforcementRequest {
  guild: Guild;
  executorId: string;
  action: EnforcementAction;
  reason: string;
  dryRun?: boolean;
  timeoutMinutes?: number;
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
      dryRun = process.env.SECURITY_DRY_RUN === "true",
      timeoutMinutes = 60,
    } = request;

    const me = guild.members.me;
    if (!me) {
      return this.fail(action, "Bot member could not be resolved in guild.");
    }

    if (executorId === guild.ownerId) {
      return this.fail(action, "Cannot enforce against the server owner.");
    }

    if (executorId === me.id) {
      return this.fail(action, "Cannot enforce against the bot itself.");
    }

    const member = await guild.members.fetch(executorId).catch(() => null);

    if (member && member.roles.highest.comparePositionTo(me.roles.highest) >= 0) {
      return this.fail(
        action,
        "Executor role position is equal to or higher than the bot.",
      );
    }

    if (dryRun) {
      console.warn(
        `🛡️ [DRY RUN] Would execute ${action} on ${member?.user.tag ?? executorId} in ${guild.name} (${guild.id}) - Reason: ${reason}`,
      );
      return {
        success: true,
        executed: false,
        action,
        reason,
      };
    }

    let retries = 3;
    while (retries > 0) {
      try {
        switch (action) {
          case "ban": {
            if (!me.permissions.has(PermissionFlagsBits.BanMembers)) {
              return this.fail(action, "Bot missing BanMembers permission.");
            }
            await guild.bans.create(executorId, { reason });
            break;
          }

          case "kick": {
            if (!me.permissions.has(PermissionFlagsBits.KickMembers)) {
              return this.fail(action, "Bot missing KickMembers permission.");
            }
            if (member) {
              await member.kick(reason);
            }
            break;
          }

          case "strip_roles": {
            if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
              return this.fail(action, "Bot missing ManageRoles permission.");
            }
            if (member) {
              await this.stripRoles(member, reason);
            }
            break;
          }

          case "timeout": {
            if (!me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
              return this.fail(action, "Bot missing ModerateMembers permission.");
            }
            if (member) {
              await member.timeout(timeoutMinutes * 60 * 1000, reason);
            }
            break;
          }
        }

        console.log(
          `⚡ Successfully enforced ${action} on ${member?.user.tag ?? executorId} in ${guild.name} (${guild.id})`,
        );

        return {
          success: true,
          executed: true,
          action,
          reason,
        };
      } catch (error: any) {
        console.error(`⚠️ Enforcement attempt failed (retries left: ${retries - 1}):`, error?.message ?? error);
        retries--;
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    return {
      success: false,
      executed: false,
      action,
      reason: "Enforcement failed after maximum retries.",
    };
  }

  private async stripRoles(
    member: GuildMember,
    reason: string,
  ): Promise<void> {
    const removableRoles = member.roles.cache.filter(
      (role) => role.editable && !role.managed && role.id !== member.guild.id,
    );

    if (removableRoles.size === 0) {
      return;
    }

    await member.roles.remove(removableRoles, reason);
  }

  private fail(
    action: EnforcementAction,
    reason: string,
  ): EnforcementResult {
    console.warn(`🛡️ Enforcement blocked: ${reason}`);

    return {
      success: false,
      executed: false,
      action,
      reason,
    };
  }
}

export const enforcementService = new EnforcementService();

