import { botClient } from './bot/client';
import { dbManager } from './database/connection';
import { redisManager } from './database/redis';
import { logger } from './utils/logger';
import './bot/events/ready';
import './bot/events/messageCreate';
import './bot/events/guildMemberAdd'; // <-- Yahan add kar dein

async function bootstrap() {
  await dbManager.connect();
  await botClient.start();

  const signals = ['SIGINT', 'SIGTERM'] as const;
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}. Initiating graceful shutdown...`);
      await botClient.shutdown();
      await dbManager.disconnect();
      await redisManager.disconnect();
      process.exit(0);
    });
  }
}

bootstrap().catch((error) => {
  logger.error({ error }, 'Critical error during application bootstrap');
  process.exit(1);
});