import { getRedisClient } from "./client.js";

const KEY_PREFIX = "aegisx:antinuke";

function createKey(
  guildId: string,
  executorId: string,
  securityAction: string,
): string {
  return [
    KEY_PREFIX,
    guildId,
    executorId,
    securityAction,
  ].join(":");
}

export interface AntiNukeCounterResult {
  count: number;
  ttl: number;
}

export async function incrementAntiNukeCounter(
  guildId: string,
  executorId: string,
  securityAction: string,
  windowSeconds: number,
): Promise<AntiNukeCounterResult> {
  const redis = getRedisClient();

  const key = createKey(
    guildId,
    executorId,
    securityAction,
  );

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(
      key,
      windowSeconds,
    );
  }

  const ttl = await redis.ttl(key);

  return {
    count,
    ttl,
  };
}

export async function clearAntiNukeCounter(
  guildId: string,
  executorId: string,
  securityAction: string,
): Promise<void> {
  const redis = getRedisClient();

  await redis.del(
    createKey(
      guildId,
      executorId,
      securityAction,
    ),
  );
}

export async function clearGuildAntiNukeCounters(
  guildId: string,
): Promise<void> {
  const redis = getRedisClient();

  const pattern =
    `${KEY_PREFIX}:${guildId}:*`;

  for await (const key of redis.scanIterator({
    MATCH: pattern,
    COUNT: 100,
  })) {
    await redis.del(key);
  }
}