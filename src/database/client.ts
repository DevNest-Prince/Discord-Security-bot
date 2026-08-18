import { MongoClient, Db } from 'mongodb';
import { env } from '../config/env.js';
import { logger } from '../core/logger.js';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  if (dbInstance) return dbInstance;

  try {
    client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    dbInstance = client.db(env.MONGODB_DB_NAME);
    logger.info({ event: 'db_connected', db: env.MONGODB_DB_NAME }, 'MongoDB connected successfully');
    return dbInstance;
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed');
  }
}

export function getDb(): Db {
  if (!dbInstance) throw new Error('Database not initialized. Call connectDatabase() first.');
  return dbInstance;
}