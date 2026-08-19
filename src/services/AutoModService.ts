import { Message } from 'discord.js';
import { redisClient } from '../database/redis.js';
import { GuildConfigService } from './GuildConfigService.js';
import { logger } from '../core/logger.js';

/**
 * Production AutoMod Service
 * Handles spam detection with Redis-backed rate limiting
 * Supports granular whitelisting (members, roles, channels, categories)
 */
export class AutoModService {
  private static readonly SPAM_THRESHOLD = 3;
  private static readonly SPAM_WINDOW = 5; // seconds

  /**
   * Check if a message is spam
   * Returns true if message should be deleted, false if it's okay
   */
  static async checkSpam(message: Message): Promise<boolean> {
    if (!message.guild || !message.member) return false;

    try {
      const guildId = message.guild.id;
      const userId = message.author.id;
      const channelId = message.channel.id;
      const categoryId = (message.channel as any).parentId || null;

      // Get guild configuration with safe fallbacks
      const config = await GuildConfigService.getConfig(guildId);
      
      // Extract whitelist data with fallbacks
      const spamWhitelist = (config?.automod?.spam || {}) as any;
      const whitelistedMembers = spamWhitelist.whitelistedMembers || [];
      const whitelistedRoles = spamWhitelist.whitelistedRoles || [];
      const whitelistedChannels = spamWhitelist.whitelistedChannels || [];
      const whitelistedCategories = spamWhitelist.whitelistedCategories || [];

      // CHECK 1: Direct member whitelist
      if (whitelistedMembers.includes(userId)) {
        logger.debug({ userId, guildId }, 'User is whitelisted (member)');
        return false;
      }

      // CHECK 2: Channel whitelist
      if (whitelistedChannels.includes(channelId)) {
        logger.debug({ channelId, guildId }, 'Channel is whitelisted');
        return false;
      }

      // CHECK 3: Category whitelist
      if (categoryId && whitelistedCategories.includes(categoryId)) {
        logger.debug({ categoryId, guildId }, 'Category is whitelisted');
        return false;
      }

      // CHECK 4: Role whitelist
      const hasWhitelistedRole = whitelistedRoles.some((roleId: string) => {
        try {
          return message.member!.roles.cache.has(roleId);
        } catch {
          return false;
        }
      });

      if (hasWhitelistedRole) {
        logger.debug({ userId, guildId }, 'User has whitelisted role');
        return false;
      }

      // SPAM DETECTION: Use Redis for rate limiting
      const key = `spam:${guildId}:${userId}`;
      let count = await redisClient.incr(key).catch(err => {
        logger.error({ err }, 'Redis error incrementing spam counter');
        return 1;
      });

      // Set expiration if this is the first message
      if (count === 1) {
        await redisClient.expire(key, this.SPAM_WINDOW).catch(err =>
          logger.warn({ err }, 'Redis error setting expiration')
        );
      }

      // Check if threshold exceeded
      if (count > this.SPAM_THRESHOLD) {
        logger.warn(
          { userId, guildId, channelId, count },
          'Spam detected - threshold exceeded'
        );
        return true;
      }

      return false;
    } catch (error) {
      logger.error({ err: error }, 'Error checking spam, allowing message as fallback');
      // On error, allow the message (fail-open approach)
      return false;
    }
  }

  /**
   * Reset spam counter for a user (called when message is deleted or user warned)
   */
  static async resetSpamCounter(guildId: string, userId: string): Promise<void> {
    try {
      const key = `spam:${guildId}:${userId}`;
      await redisClient.del(key).catch(err =>
        logger.warn({ err }, 'Failed to reset spam counter')
      );
    } catch (error) {
      logger.error({ err: error }, 'Error resetting spam counter');
    }
  }

  /**
   * Get current spam warning level for a user (0-4)
   */
  static async getSpamLevel(guildId: string, userId: string): Promise<number> {
    try {
      const key = `spam:${guildId}:${userId}`;
      const count = await redisClient.get(key);
      return count ? Math.min(parseInt(count), 4) : 0;
    } catch (error) {
      logger.error({ err: error }, 'Error getting spam level');
      return 0;
    }
  }
}