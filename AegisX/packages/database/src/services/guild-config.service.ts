import {
  createGuildConfig,
  findGuildConfig,
} from "../repositories/guild-config.repository.js";

import type { GuildConfig } from "../models/GuildConfig.js";

export async function getGuildConfig(
  guildId: string,
): Promise<GuildConfig> {
  const existing = await findGuildConfig(guildId);

  if (existing) {
    return existing;
  }

  return createGuildConfig(guildId);
}