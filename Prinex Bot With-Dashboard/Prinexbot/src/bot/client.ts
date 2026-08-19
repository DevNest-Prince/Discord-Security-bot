import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

export class SecurityBotClient extends Client {
  public commands: Collection<string, any> = new Collection();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
    });
  }

  public async start(): Promise<void> {
    try {
      logger.info('Initializing Discord bot client...');
      await this.login(env.DISCORD_TOKEN);
      logger.info(`Bot successfully logged in as ${this.user?.tag}`);
    } catch (error) {
      logger.error({ error }, 'Failed to start Discord bot client');
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Discord bot client...');
    this.destroy();
  }
}

export const botClient = new SecurityBotClient();