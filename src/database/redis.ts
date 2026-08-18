import { createClient } from 'redis';
import { env } from '../config/env.js';
import { logger } from '../core/logger.js';

export const redisClient = createClient({ url: env.REDIS_URL });

redisClient.on('error', (err) => logger.error({ err }, 'Redis Client Error'));
redisClient.on('ready', () => logger.info('Redis connected successfully'));

export async function connectRedis() {
  await redisClient.connect();
}

export async function disconnectRedis() {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}