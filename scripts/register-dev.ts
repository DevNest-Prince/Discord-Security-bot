import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/core/logger.js';

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot, database, and Redis latency')
    .toJSON(),
    
  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display detailed information about the server')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display detailed information about a user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to check')
        .setRequired(false) // Required false taaki bina mention kiye khud ka info bhi dekh sakein
    )
    .toJSON(),

    new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Manage server security whitelists')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View all whitelisted items')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add an item to the whitelist')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Type of item to whitelist')
            .setRequired(true)
            .addChoices(
              { name: 'Role', value: 'role' },
              { name: 'User', value: 'user' },
              { name: 'Channel', value: 'channel' },
              { name: 'Category', value: 'category' }
            )
        )
        .addStringOption(option =>
          option.setName('target')
            .setDescription('The role, user, channel, or category ID/mention')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove an item from the whitelist')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Type of item to remove')
            .setRequired(true)
            .addChoices(
              { name: 'Role', value: 'role' },
              { name: 'User', value: 'user' },
              { name: 'Channel', value: 'channel' },
              { name: 'Category', value: 'category' }
            )
        )
        .addStringOption(option =>
          option.setName('target')
            .setDescription('The role, user, channel, or category ID/mention')
            .setRequired(true)
        )
    )
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands for Dev Guild...`);
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