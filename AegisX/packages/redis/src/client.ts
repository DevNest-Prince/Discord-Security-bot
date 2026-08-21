import { createClient } from "redis";

export let redisClient: ReturnType<typeof createClient> | null = null;

export async function connectRedis() {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("REDIS_URL is missing from environment variables.");
  }

  redisClient = createClient({
    url,
  });

  redisClient.on("error", (error) => {
    console.error("❌ Redis error:", error);
  });

  console.log("🔄 Connecting to Redis...");

  await redisClient.connect();

  console.log("⚡ Redis is ready!");
}

export async function disconnectRedis() {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

export function getRedisClient() {
  if (!redisClient) {
    throw new Error("Redis client is not initialized.");
  }

  return redisClient;
}