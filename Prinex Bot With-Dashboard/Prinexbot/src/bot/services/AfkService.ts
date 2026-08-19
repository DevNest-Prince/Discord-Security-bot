import { redisManager } from '../../database/redis';
import { dbManager } from '../../database/connection';

interface AfkData {
  userId: string;
  guildId: string;
  reason: string;
  timestamp: number;
}

export class AfkService {
  private static COLLECTION = 'user_afks';

  public static async setAfk(userId: string, guildId: string, reason: string): Promise<void> {
    const timestamp = Date.now();
    const afkData: AfkData = { userId, guildId, reason, timestamp };

    // 1. Save to MongoDB
    const db = await dbManager.connect();
    await db.collection(this.COLLECTION).updateOne(
      { userId, guildId },
      { $set: afkData },
      { upsert: true }
    );

    // 2. Cache in Redis
    const cacheKey = `afk:${guildId}:${userId}`;
    await redisManager.client.set(cacheKey, JSON.stringify(afkData));
  }

  public static async getAfk(userId: string, guildId: string): Promise<AfkData | null> {
    const cacheKey = `afk:${guildId}:${userId}`;

    // Check Redis first
    const cached = await redisManager.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to MongoDB
    const db = await dbManager.connect();
    const data = await db.collection(this.COLLECTION).findOne({ userId, guildId }) as unknown as AfkData;
    
    if (data) {
      await redisManager.client.set(cacheKey, JSON.stringify(data));
    }
    return data;
  }

  public static async removeAfk(userId: string, guildId: string): Promise<boolean> {
    const cacheKey = `afk:${guildId}:${userId}`;

    // Remove from Redis
    const deletedCache = await redisManager.client.del(cacheKey);

    // Remove from MongoDB
    const db = await dbManager.connect();
    const deletedDb = await db.collection(this.COLLECTION).deleteOne({ userId, guildId });

    return deletedCache > 0 || deletedDb.deletedCount > 0;
  }
}