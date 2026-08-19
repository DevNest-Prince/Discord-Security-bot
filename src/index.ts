import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/env.js';
import { logger } from './core/logger.js';
import { connectDatabase, disconnectDatabase } from './database/client.js';
import { connectRedis, disconnectRedis } from './database/redis.js';

// Naya Event Import kiya
import { InteractionCreateEvent } from './events/interactionCreate.js';
import { MessageCreateEvent } from './events/messageCreate.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

async function bootstrap() {
  try {
    logger.info('Starting Discord Security Bot...');

    await connectDatabase();
    await connectRedis();

    // Bot ko Event sikhaya
    (client as any).on(InteractionCreateEvent.name, (interaction: any) => InteractionCreateEvent.execute(interaction));
    (client as any).on(MessageCreateEvent.name, (message: any) => MessageCreateEvent.execute(message));

    await client.login(env.DISCORD_TOKEN);
    logger.info({ event: 'bot_ready', user: client.user?.tag }, 'Bot successfully logged in and is now ONLINE! 🚀');
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start bot');
    process.exit(1);
  }
}

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  client.destroy();
  await disconnectDatabase();
  await disconnectRedis();
  logger.info('Shutdown complete.');
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

bootstrap();