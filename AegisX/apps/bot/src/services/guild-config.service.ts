import {
  getGuildConfig as getMongoGuildConfig,
} from "@aegisx/database";

import {
  getGuildConfigCache,
  setGuildConfigCache,
} from "@aegisx/redis";

export async function getGuildConfig(guildId: string) {
  // 1. Redis first
  const cached =
    await getGuildConfigCache(guildId);

  if (cached) {
    console.log(`⚡ Guild config cache hit: ${guildId}`);
    return cached;
  }

  // 2. MongoDB fallback
  console.log(`🗄️ Guild config cache miss: ${guildId}`);

  const config =
    await getMongoGuildConfig(guildId);

  // 3. Store in Redis
  await setGuildConfigCache(guildId, config);

  return config;
}