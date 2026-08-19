import { botClient } from '../client';
import { logger } from '../../utils/logger';

botClient.once('clientReady', () => {
  if (botClient.user) {
    logger.info(`Logged in and ready as ${botClient.user.tag} on ${botClient.guilds.cache.size} guilds.`);
    botClient.user.setActivity('over community security', { type: 3 });
  }
});