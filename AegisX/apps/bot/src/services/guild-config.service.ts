import {
  getGuildConfig as getMongoGuildConfig,
} from "@aegisx/database";

import {
  getGuildConfigCache,
  setGuildConfigCache,
} from "@aegisx/redis";

type GuildSecurityConfig = Awaited<
  ReturnType<typeof getMongoGuildConfig>
>;

export async function getGuildConfig(
  guildId: string,
): Promise<GuildSecurityConfig> {
  const cached =
    await getGuildConfigCache<GuildSecurityConfig>(guildId);

  if (cached) {
    console.log(`⚡ Guild config cache hit: ${guildId}`);
    return cached;
  }

  console.log(`🗄️ Guild config cache miss: ${guildId}`);

  const config =
    await getMongoGuildConfig(guildId);

  await setGuildConfigCache(guildId, config);

  return config;
}