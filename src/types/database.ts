/**
 * Database Schema Types
 * Defines MongoDB collection structures for the Discord Security Bot
 * Future-proofed for dashboard integration
 */

export interface GuildConfig {
  guildId: string;
  prefix: string;
  
  automod: {
    spam: {
      enabled: boolean;
      threshold: number; // messages per 5 seconds
      whitelistedMembers: string[];
      whitelistedRoles: string[];
      whitelistedChannels: string[];
      whitelistedCategories: string[];
    };
    
    logging?: {
      enabled: boolean;
      logChannelId?: string;
      events?: string[]; // 'spam', 'antiNuke', etc.
    };
    
    antiNuke?: {
      enabled: boolean;
      whitelistedIds: string[];
    };
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CacheConfig {
  prefix?: string;
  config?: Partial<GuildConfig>;
}

/**
 * Whitelist types for type-safe configuration
 */
export type WhitelistType = 
  | 'whitelistedMembers' 
  | 'whitelistedRoles' 
  | 'whitelistedChannels' 
  | 'whitelistedCategories';

export type WhitelistAction = 'add' | 'remove';

/**
 * Audit log for moderation actions (future feature)
 */
export interface AuditLog {
  guildId: string;
  userId: string;
  action: 'spam_deleted' | 'user_warned' | 'whitelist_updated' | string;
  targetId?: string;
  reason?: string;
  timestamp: Date;
}
