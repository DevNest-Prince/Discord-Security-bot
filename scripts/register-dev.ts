import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/core/logger.js';

// Hamari command ka structure jo Discord ko dikhega
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot, database, and Redis latency')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands for Dev Guild...`);

    // Discord API ko command bhej rahe hain (Sirf tumhare test server ke liye taaki instantly update ho)
    const data: any = await rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID),
      { body: commands }
    );

    logger.info(`Successfully registered ${data.length} application (/) commands! ✅`);
  } catch (error) {
    logger.error({ err: error }, 'Failed to register commands');
  }
}

registerCommands();