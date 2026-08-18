import { Client } from 'discord.js';
import { getDb } from '../../../database/client.js';
import { redisClient } from '../../../database/redis.js';

export class UtilityService {
  static async getSystemPing(client: Client) {
    const wsLatency = client.ws.ping;
    
    // Check MongoDB Ping
    const startDb = Date.now();
    let dbStatus = 'Disconnected';
    try {
      await getDb().command({ ping: 1 });
      dbStatus = `${Date.now() - startDb}ms`;
    } catch {
      dbStatus = 'Error';
    }

    // Check Redis Ping
    let redisStatus = 'Disconnected';
    try {
      const startRedis = Date.now();
      await redisClient.ping();
      redisStatus = `${Date.now() - startRedis}ms`;
    } catch {
      redisStatus = 'Error';
    }

    return { wsLatency, dbStatus, redisStatus };
  }
}