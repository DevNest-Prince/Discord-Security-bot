import { getDb } from '../database/client.js';
import { redisClient } from '../database/redis.js';
import { GuildConfig, WhitelistType, WhitelistAction } from '../types/database.js';
import { logger } from '../core/logger.js';

const DEFAULT_PREFIX = 'p!';

/**
 * Production-grade Guild Configuration Service
 * Handles all guild settings with Redis caching and error resilience
 */
export class GuildConfigService {
  
  /**
   * Get guild prefix with fallback chain
   */
  static async getPrefix(guildId: string): Promise<string> {
    try {
      const cacheKey = `guild:${guildId}:prefix`;
      const cachedPrefix = await redisClient.get(cacheKey);
      
      if (cachedPrefix) return cachedPrefix;

      const db = getDb();
      const config = await db.collection('guild_configs').findOne({ guildId });
      const prefix = config?.prefix || DEFAULT_PREFIX;

      await redisClient.setEx(cacheKey, 3600, prefix).catch(err => 
        logger.warn({ err }, 'Redis cache failed for prefix')
      );
      
      return prefix;
    } catch (error) {
      logger.error({ err: error, guildId }, 'Error fetching prefix, returning default');
      return DEFAULT_PREFIX;
    }
  }

  /**
   * Set guild prefix with cache invalidation
   */
  static async setPrefix(guildId: string, newPrefix: string): Promise<void> {
    try {
      const db = getDb();
      const cacheKey = `guild:${guildId}:prefix`;

      await db.collection('guild_configs').updateOne(
        { guildId },
        { 
          $set: { 
            guildId, 
            prefix: newPrefix, 
            updatedAt: new Date() 
          } 
        },
        { upsert: true }
      );

      await redisClient.setEx(cacheKey, 3600, newPrefix).catch(err =>
        logger.warn({ err }, 'Redis cache failed when setting prefix')
      );
    } catch (error) {
      logger.error({ err: error, guildId, prefix: newPrefix }, 'Error setting prefix');
      throw error;
    }
  }

  /**
   * Get full guild configuration with fallback
   */
  static async getConfig(guildId: string): Promise<Partial<GuildConfig>> {
    try {
      const cacheKey = `guild:${guildId}:config`;
      const cached = await redisClient.get(cacheKey).catch(() => null);
      
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          logger.warn({ guildId }, 'Corrupted cache, fetching from DB');
        }
      }

      const db = getDb();
      const config = await db.collection('guild_configs').findOne({ guildId }) as any;
      
      // SAFE FALLBACK: Return structured default if no config exists
      const result = config || {
        guildId,
        prefix: DEFAULT_PREFIX,
        automod: {
          spam: {
            enabled: true,
            threshold: 3,
            whitelistedMembers: [],
            whitelistedRoles: [],
            whitelistedChannels: [],
            whitelistedCategories: []
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result)).catch(err =>
        logger.warn({ err }, 'Redis cache failed when setting config')
      );

      return result;
    } catch (error) {
      logger.error({ err: error, guildId }, 'Error fetching config, returning safe default');
      // Return safe defaults to prevent crashes
      return {
        guildId,
        prefix: DEFAULT_PREFIX,
        automod: {
          spam: {
            enabled: true,
            threshold: 3,
            whitelistedMembers: [],
            whitelistedRoles: [],
            whitelistedChannels: [],
            whitelistedCategories: []
          }
        }
      };
    }
  }

  /**
   * Update whitelist with validation and cache invalidation
   */
  static async updateWhitelist(
    guildId: string, 
    type: WhitelistType, 
    targetId: string, 
    action: WhitelistAction
  ): Promise<void> {
    try {
      const db = getDb();
      const cacheKey = `guild:${guildId}:config`;

      // Validate targetId is not empty
      if (!targetId || typeof targetId !== 'string') {
        throw new Error(`Invalid targetId provided: ${targetId}`);
      }

      const updateQuery = action === 'add' 
        ? { $addToSet: { [`automod.spam.${type}`]: targetId } }
        : { $pull: { [`automod.spam.${type}`]: targetId } };

      const result = await db.collection('guild_configs').updateOne(
        { guildId },
        updateQuery as any,
        { upsert: true }
      );

      // Invalidate cache after update
      await redisClient.del(cacheKey).catch(err =>
        logger.warn({ err }, 'Failed to invalidate cache')
      );

      logger.debug({ guildId, type, targetId, action }, 'Whitelist updated');
    } catch (error) {
      logger.error({ err: error, guildId, type, targetId, action }, 'Error updating whitelist');
      throw error;
    }
  }

  /**
   * Get specific whitelist by type
   */
  static async getWhitelist(guildId: string, type: WhitelistType): Promise<string[]> {
    try {
      const config = await this.getConfig(guildId);
      const whitelist = config.automod?.spam?.[type] || [];
      return Array.isArray(whitelist) ? whitelist : [];
    } catch (error) {
      logger.error({ err: error, guildId, type }, 'Error fetching whitelist');
      return [];
    }
  }

  /**
   * Clear entire whitelist for a type
   */
  static async clearWhitelist(guildId: string, type: WhitelistType): Promise<void> {
    try {
      const db = getDb();
      const cacheKey = `guild:${guildId}:config`;

      await db.collection('guild_configs').updateOne(
        { guildId },
        { $set: { [`automod.spam.${type}`]: [] } },
        { upsert: true }
      );

      await redisClient.del(cacheKey).catch(err =>
        logger.warn({ err }, 'Failed to invalidate cache')
      );
    } catch (error) {
      logger.error({ err: error, guildId, type }, 'Error clearing whitelist');
      throw error;
    }
  }
}