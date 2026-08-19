import { MongoClient, Db } from 'mongodb';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

class DatabaseManager {
  private client: MongoClient;
  private db: Db | null = null;

  constructor() {
    this.client = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      connectTimeoutMS: 10000,
    });
  }

  public async connect(): Promise<Db> {
    if (this.db) return this.db;

    try {
      await this.client.connect();
      this.db = this.client.db();
      logger.info('Successfully connected to MongoDB cluster.');
      return this.db;
    } catch (error) {
      logger.error({ error }, 'Failed to connect to MongoDB');
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.close();
      logger.info('MongoDB connection closed gracefully.');
    } catch (error) {
      logger.error({ error }, 'Error during MongoDB disconnection');
    }
  }
}

export const dbManager = new DatabaseManager();