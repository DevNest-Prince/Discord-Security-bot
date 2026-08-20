import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function connectRedis() {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("REDIS_URL is missing from environment variables.");
  }

  redisClient = createClient({
    url,
  });

  redisClient.on("error", (error: unknown) => {
    console.error("❌ Redis error:", error);
  });

  redisClient.on("connect", () => {
    console.log("🔄 Connecting to Redis...");
  });

  redisClient.on("ready", () => {
    console.log("⚡ Redis is ready!");
  });

  await redisClient.connect();

  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    redisClient = null;

    console.log("🔌 Redis disconnected.");
  }
}