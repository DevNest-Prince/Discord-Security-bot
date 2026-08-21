import { redisClient } from "./client.js";

const GUILD_CONFIG_TTL = 300; // 5 minutes

function getGuildConfigKey(guildId: string): string {
  return `guild:${guildId}:config`;
}

export async function getGuildConfigCache<T>(
  guildId: string,
): Promise<T | null> {
  if (!redisClient?.isOpen) {
    return null;
  }

  const key = getGuildConfigKey(guildId);
  const data = await redisClient.get(key);

  if (!data) {
    return null;
  }

  return JSON.parse(data) as T;
}

export async function setGuildConfigCache<T>(
  guildId: string,
  config: T,
): Promise<void> {
  if (!redisClient?.isOpen) {
    return;
  }

  const key = getGuildConfigKey(guildId);

  await redisClient.set(key, JSON.stringify(config), {
    EX: GUILD_CONFIG_TTL,
  });
}

export async function deleteGuildConfigCache(
  guildId: string,
): Promise<void> {
  if (!redisClient?.isOpen) {
    return;
  }

  const key = getGuildConfigKey(guildId);

  await redisClient.del(key);
}