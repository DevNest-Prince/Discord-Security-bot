import Redis from 'ioredis';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

class RedisManager {
  public client: Redis;

  constructor() {
    this.client = new Redis(env.REDIS_URL, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      logger.info('Successfully connected to Redis instance.');
    });

    this.client.on('error', (error) => {
      logger.error({ error }, 'Redis connection error encountered');
    });
  }

  public async disconnect(): Promise<void> {
    await this.client.quit();
    logger.info('Redis connection closed.');
  }
}

export const redisManager = new RedisManager();