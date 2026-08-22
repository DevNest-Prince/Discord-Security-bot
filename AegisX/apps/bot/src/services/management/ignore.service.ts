import { getGuildConfig, updateGuildConfig, type IgnoreRule } from "@aegisx/database";

export class IgnoreService {
  async isIgnored(
    guildId: string,
    target: { channelId?: string; roleIds?: string[]; userId?: string },
    scope: "commands" | "automod" | "logging" | "antinuke" = "commands",
  ): Promise<boolean> {
    const config = await getGuildConfig(guildId);
    const rules: IgnoreRule[] = config.ignoreSystem?.rules || [];

    for (const rule of rules) {
      if (rule.scope !== "all" && rule.scope !== scope) continue;

      if (rule.targetType === "channel" && target.channelId && rule.targetId === target.channelId) {
        return true;
      }
      if (rule.targetType === "user" && target.userId && rule.targetId === target.userId) {
        return true;
      }
      if (rule.targetType === "role" && target.roleIds && target.roleIds.includes(rule.targetId)) {
        return true;
      }
    }

    return false;
  }

  async addIgnoreRule(guildId: string, rule: IgnoreRule): Promise<boolean> {
    const config = await getGuildConfig(guildId);
    const rules: IgnoreRule[] = config.ignoreSystem?.rules || [];

    const exists = rules.some((r) => r.targetId === rule.targetId && r.scope === rule.scope);
    if (exists) return false;

    rules.push(rule);
    await updateGuildConfig(guildId, {
      ...config,
      ignoreSystem: { rules },
    });

    return true;
  }

  async removeIgnoreRule(guildId: string, targetId: string, scope = "all"): Promise<boolean> {
    const config = await getGuildConfig(guildId);
    const rules: IgnoreRule[] = config.ignoreSystem?.rules || [];

    const filtered = rules.filter((r) => !(r.targetId === targetId && (scope === "all" || r.scope === scope)));
    if (filtered.length === rules.length) return false;

    await updateGuildConfig(guildId, {
      ...config,
      ignoreSystem: { rules: filtered },
    });

    return true;
  }

  async getRules(guildId: string): Promise<IgnoreRule[]> {
    const config = await getGuildConfig(guildId);
    return config.ignoreSystem?.rules || [];
  }
}

export const ignoreService = new IgnoreService();
