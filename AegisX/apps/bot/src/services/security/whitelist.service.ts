import {
  addAdvancedWhitelist,
  removeAdvancedWhitelist,
  isTargetWhitelisted,
  listGuildWhitelists,
  type AdvancedWhitelist,
} from "@aegisx/database";
import type { GuildMember, TextChannel, User } from "discord.js";

export class WhitelistService {
  /**
   * Checks if a member/user or channel is whitelisted for a specific module.
   */
  async isWhitelisted(
    guildId: string,
    target: GuildMember | User | TextChannel | string,
    module: AdvancedWhitelist["module"],
  ): Promise<boolean> {
    const targetIds: string[] = [];

    if (typeof target === "string") {
      targetIds.push(target);
    } else if ("roles" in target && target.roles?.cache) {
      // GuildMember -> check user ID + all their role IDs
      targetIds.push(target.id);
      target.roles.cache.forEach((r) => targetIds.push(r.id));
    } else if ("parentId" in target) {
      // Channel -> check channel ID + parent category ID
      targetIds.push(target.id);
      if (target.parentId) targetIds.push(target.parentId);
    } else if ("id" in target) {
      // User
      targetIds.push(target.id);
    }

    return isTargetWhitelisted(guildId, targetIds, module);
  }

  async addWhitelist(params: {
    guildId: string;
    targetId: string;
    targetType: AdvancedWhitelist["targetType"];
    module: AdvancedWhitelist["module"];
    reason: string;
    createdBy: string;
    durationSeconds?: number | null;
  }): Promise<AdvancedWhitelist> {
    const expiresAt =
      params.durationSeconds && params.durationSeconds > 0
        ? new Date(Date.now() + params.durationSeconds * 1000)
        : null;

    return addAdvancedWhitelist({
      guildId: params.guildId,
      targetId: params.targetId,
      targetType: params.targetType,
      module: params.module,
      reason: params.reason,
      createdBy: params.createdBy,
      expiresAt,
    });
  }

  async removeWhitelist(guildId: string, targetId: string, module = "all"): Promise<boolean> {
    return removeAdvancedWhitelist(guildId, targetId, module);
  }

  async getWhitelists(guildId: string): Promise<AdvancedWhitelist[]> {
    return listGuildWhitelists(guildId);
  }
}

export const whitelistService = new WhitelistService();
