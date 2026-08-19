import { Db } from 'mongodb';
import { dbManager } from '../../database/connection';
import { redisManager } from '../../database/redis';
import { logger } from '../../utils/logger';

interface WelcomeConfig {
  enabled: boolean;
  channelId: string | null;
  message: string;
  color: string;
}

interface GuildConfig {
  guildId: string;
  antiZalgoEnabled: boolean;
  whitelistedChannels: string[];
  whitelistedRoles: string[];
  welcome: WelcomeConfig;
}

export class GuildConfigService {
  private static COLLECTION = 'guild_configs';

  private static async getCollection(): Promise<Db> {
    return await dbManager.connect();
  }

  public static async getConfig(guildId: string): Promise<GuildConfig> {
    const cacheKey = `guild:config:${guildId}`;
    
    // 1. Check Redis Cache first
    const cached = await redisManager.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Fallback to MongoDB
    const db = await this.getCollection();
    let config = await db.collection(this.COLLECTION).findOne({ guildId }) as unknown as GuildConfig;

    if (!config) {
      config = {
        guildId,
        antiZalgoEnabled: true,
        whitelistedChannels: [],
        whitelistedRoles: [],
        welcome: {
          enabled: false,
          channelId: null,
          message: 'Welcome {user} to {server}! 🎉',
          color: '#FF007F'
        },
      };
      await db.collection(this.COLLECTION).insertOne(config);
    } else {
      // Ensure welcome property exists for older documents
      if (!config.welcome) {
        config.welcome = {
          enabled: false,
          channelId: null,
          message: 'Welcome {user} to {server}! 🎉',
          color: '#FF007F'
        };
      }
    }

    // 3. Store back in Redis with a 5-minute TTL
    await redisManager.client.setex(cacheKey, 300, JSON.stringify(config));
    return config;
  }

  public static async updateConfig(guildId: string, updateData: Partial<GuildConfig>): Promise<void> {
    const db = await this.getCollection();
    await db.collection(this.COLLECTION).updateOne(
      { guildId },
      { $set: updateData },
      { upsert: true }
    );

    // Invalidate Cache
    const cacheKey = `guild:config:${guildId}`;
    await redisManager.client.del(cacheKey);
    logger.info({ guildId, updateData }, 'Guild configuration updated and cache invalidated.');
  }
}