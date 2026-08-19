import { CommandInteraction, PermissionsBitField, Role, User, ChatInputCommandInteraction, CacheType } from 'discord.js';
import { GuildConfigService } from '../../services/GuildConfigService.js';
import { 
  createWhitelistEmbed, 
  createSuccessEmbed, 
  createErrorEmbed,
  createSecurityEmbed,
  createConfirmationEmbed
} from '../../ui/embeds/builders.js';
import { Icons } from '../../ui/icons.js';
import { logger } from '../../core/logger.js';

/**
 * Production-grade Whitelist Command for Slash Commands
 * Handles all whitelist operations with proper Discord interaction lifecycle
 * Respects 3-second response deadline
 */
export const WhitelistCommand = {
  name: 'whitelist',
  description: 'Manage server security whitelists',

  async execute(interaction: CommandInteraction) {
    // Type guard for slash command
    if (!interaction.isChatInputCommand()) return;
    
    const chatInput = interaction as ChatInputCommandInteraction<CacheType>;

    // Check permissions immediately
    if (!chatInput.member?.permissions || typeof chatInput.member.permissions === 'string') {
      const errEmbed = createErrorEmbed('You need **Administrator** permission to use this command!');
      await chatInput.reply({ embeds: [errEmbed], ephemeral: true });
      return;
    }

    if (!chatInput.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const errEmbed = createErrorEmbed('You need **Administrator** permission to use this command!');
      await chatInput.reply({ embeds: [errEmbed], ephemeral: true });
      return;
    }

    try {
      const subcommand = chatInput.options.getSubcommand();
      const guildId = chatInput.guildId!;
      const guild = chatInput.guild!;

      switch (subcommand) {
        case 'view':
          await handleViewWhitelist(chatInput, guildId, guild);
          break;

        case 'add':
          await handleAddWhitelist(chatInput, guildId, guild);
          break;

        case 'remove':
          await handleRemoveWhitelist(chatInput, guildId, guild);
          break;

        default:
          await chatInput.reply({
            embeds: [createErrorEmbed('Invalid subcommand!')],
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error({ err: error }, 'Error executing whitelist command');
      const errorEmbed = createErrorEmbed('An error occurred while processing your request.');
      
      if (chatInput.replied || chatInput.deferred) {
        await chatInput.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await chatInput.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};

/**
 * Handle /whitelist view subcommand
 */
async function handleViewWhitelist(
  interaction: ChatInputCommandInteraction<CacheType>,
  guildId: string,
  guild: any
) {
  // Defer to stay within 3-second limit
  await interaction.deferReply({ ephemeral: false });

  try {
    const config = await GuildConfigService.getConfig(guildId);
    const spamWhitelist = (config?.automod?.spam || {}) as any;

    // Get all whitelisted items with proper fallbacks
    let whitelistedRoles: string[] = spamWhitelist.whitelistedRoles || [];
    let whitelistedMembers: string[] = spamWhitelist.whitelistedMembers || [];
    let whitelistedChannels: string[] = spamWhitelist.whitelistedChannels || [];
    let whitelistedCategories: string[] = spamWhitelist.whitelistedCategories || [];

    // Auto-cleanup: Remove invalid entries silently
    const validRoles = whitelistedRoles.filter(id => guild.roles.cache.has(id));
    const validChannels = whitelistedChannels.filter(id => guild.channels.cache.has(id));
    const validCategories = whitelistedCategories.filter(id => {
      const ch = guild.channels.cache.get(id);
      return ch && ch.type === 4; // Channel type 4 = category
    });

    // Update database if cleanup needed
    if (validRoles.length !== whitelistedRoles.length) {
      for (const id of whitelistedRoles) {
        if (!guild.roles.cache.has(id)) {
          await GuildConfigService.updateWhitelist(guildId, 'whitelistedRoles', id, 'remove');
        }
      }
      whitelistedRoles = validRoles;
    }

    if (validChannels.length !== whitelistedChannels.length) {
      for (const id of whitelistedChannels) {
        if (!guild.channels.cache.has(id)) {
          await GuildConfigService.updateWhitelist(guildId, 'whitelistedChannels', id, 'remove');
        }
      }
      whitelistedChannels = validChannels;
    }

    // Format display strings
    const rolesList = whitelistedRoles.length 
      ? whitelistedRoles.map(id => `${guild.roles.cache.get(id)?.name || 'Unknown'} (<@&${id}>)`).join('\n')
      : 'None';
    
    const usersListPromise = whitelistedMembers.length
      ? Promise.all(
          whitelistedMembers.map(async id => {
            try {
              const user = await guild.client.users.fetch(id);
              return `${user.username} (<@${id}>)`;
            } catch {
              return `Unknown (<@${id}>)`;
            }
          })
        ).then(names => names.join('\n'))
      : Promise.resolve('None');
    
    const channelsList = whitelistedChannels.length
      ? whitelistedChannels.map(id => `${guild.channels.cache.get(id)?.name || 'Unknown'} (<#${id}>)`).join('\n')
      : 'None';
    
    const categoriesList = whitelistedCategories.length
      ? whitelistedCategories.map(id => {
        const cat = guild.channels.cache.get(id);
        return `${cat?.name || 'Unknown'} (\`${id}\`)`;
      }).join('\n')
      : 'None';

    const usersListFormatted = await usersListPromise;

    const embed = createSecurityEmbed(`${Icons.WHITELIST} Automod Whitelist`, 'Current items bypassing spam detection:')
      .addFields(
        {
          name: `${Icons.ROLE} Whitelisted Roles (${whitelistedRoles.length})`,
          value: rolesList,
          inline: false
        },
        {
          name: `${Icons.USER} Whitelisted Users (${whitelistedMembers.length})`,
          value: usersListFormatted,
          inline: false
        },
        {
          name: `${Icons.CHANNEL} Whitelisted Channels (${whitelistedChannels.length})`,
          value: channelsList,
          inline: false
        },
        {
          name: `${Icons.CATEGORY} Whitelisted Categories (${whitelistedCategories.length})`,
          value: categoriesList,
          inline: false
        }
      )
      .setFooter({ text: 'Use /whitelist add or /whitelist remove to manage items' });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error({ err: error }, 'Error viewing whitelist');
    await interaction.editReply({
      embeds: [createErrorEmbed('Failed to retrieve whitelist. Please try again.')]
    });
  }
}

/**
 * Handle /whitelist add subcommand
 */
async function handleAddWhitelist(
  interaction: ChatInputCommandInteraction<CacheType>,
  guildId: string,
  guild: any
) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const type = interaction.options.getString('type')!;
    const rawTarget = interaction.options.getString('target')!;

    let targetId = '';
    let targetName = '';
    let dbField: 'whitelistedMembers' | 'whitelistedRoles' | 'whitelistedChannels' | 'whitelistedCategories' = 'whitelistedRoles';

    // Parse target based on type
    if (type === 'role') {
      dbField = 'whitelistedRoles';
      const roleMatch = rawTarget.replace(/[<@&#>]/g, '');
      const role = guild.roles.cache.get(roleMatch) || (await guild.roles.fetch(roleMatch).catch(() => null));

      if (!role) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Could not find the specified role. Use a valid role ID or mention.')]
        });
        return;
      }

      targetId = role.id;
      targetName = role.name;
    } else if (type === 'user') {
      dbField = 'whitelistedMembers';
      const userMatch = rawTarget.replace(/[<@!>]/g, '');
      let user: User | null = null;

      try {
        user = await guild.client.users.fetch(userMatch);
      } catch {
        try {
          const member = await guild.members.fetch(userMatch);
          user = member.user;
        } catch {
          // User not found
        }
      }

      if (!user) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Could not find the specified user. Use a valid user ID or mention.')]
        });
        return;
      }

      targetId = user.id;
      targetName = user.username;
    } else if (type === 'channel') {
      dbField = 'whitelistedChannels';
      const channelMatch = rawTarget.replace(/[<#>]/g, '');
      const channel = guild.channels.cache.get(channelMatch);

      if (!channel) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Could not find the specified channel. Use a valid channel ID or mention.')]
        });
        return;
      }

      targetId = channel.id;
      targetName = channel.name;
    } else if (type === 'category') {
      dbField = 'whitelistedCategories';
      const catMatch = rawTarget.replace(/[<#>]/g, '');
      const category = guild.channels.cache.get(catMatch);

      if (!category || category.type !== 4) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Could not find the specified category. Use a valid category ID.')]
        });
        return;
      }

      targetId = category.id;
      targetName = category.name;
    }

    // Check if already whitelisted
    const currentWhitelist = await GuildConfigService.getWhitelist(guildId, dbField);
    if (currentWhitelist.includes(targetId)) {
      await interaction.editReply({
        embeds: [createConfirmationEmbed(
          'Already Whitelisted',
          `${targetName} is already in the ${type} whitelist.`
        )]
      });
      return;
    }

    // Add to whitelist
    await GuildConfigService.updateWhitelist(guildId, dbField, targetId, 'add');

    const successEmbed = createSuccessEmbed(
      `${targetName} has been **added** to the ${type} whitelist. They will no longer trigger spam detection.`
    ).setTitle(`${Icons.ADD} Whitelist Updated`);

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    logger.error({ err: error }, 'Error adding to whitelist');
    await interaction.editReply({
      embeds: [createErrorEmbed('Failed to add to whitelist. Please try again.')]
    });
  }
}

/**
 * Handle /whitelist remove subcommand
 */
async function handleRemoveWhitelist(
  interaction: ChatInputCommandInteraction<CacheType>,
  guildId: string,
  guild: any
) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const type = interaction.options.getString('type')!;
    const rawTarget = interaction.options.getString('target')!;

    let targetId = '';
    let targetName = '';
    let dbField: 'whitelistedMembers' | 'whitelistedRoles' | 'whitelistedChannels' | 'whitelistedCategories' = 'whitelistedRoles';

    // Parse target based on type
    if (type === 'role') {
      dbField = 'whitelistedRoles';
      const roleMatch = rawTarget.replace(/[<@&#>]/g, '');
      const role = guild.roles.cache.get(roleMatch) || (await guild.roles.fetch(roleMatch).catch(() => null));

      if (!role) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Could not find the specified role.')]
        });
        return;
      }

      targetId = role.id;
      targetName = role.name;
    } else if (type === 'user') {
      dbField = 'whitelistedMembers';
      const userMatch = rawTarget.replace(/[<@!>]/g, '');
      let user: User | null = null;

      try {
        user = await guild.client.users.fetch(userMatch);
      } catch {
        try {
          const member = await guild.members.fetch(userMatch);
          user = member.user;
        } catch {
          // User not found, but we can still remove by ID if provided
          targetId = userMatch;
        }
      }

      if (user) {
        targetId = user.id;
        targetName = user.username;
      } else if (!targetId) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Could not find the specified user.')]
        });
        return;
      }
    } else if (type === 'channel') {
      dbField = 'whitelistedChannels';
      const channelMatch = rawTarget.replace(/[<#>]/g, '');
      const channel = guild.channels.cache.get(channelMatch);

      if (!channel) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Could not find the specified channel.')]
        });
        return;
      }

      targetId = channel.id;
      targetName = channel.name;
    } else if (type === 'category') {
      dbField = 'whitelistedCategories';
      const catMatch = rawTarget.replace(/[<#>]/g, '');
      const category = guild.channels.cache.get(catMatch);

      if (!category || category.type !== 4) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Could not find the specified category.')]
        });
        return;
      }

      targetId = category.id;
      targetName = category.name;
    }

    // Check if in whitelist
    const currentWhitelist = await GuildConfigService.getWhitelist(guildId, dbField);
    if (!currentWhitelist.includes(targetId)) {
      await interaction.editReply({
        embeds: [createConfirmationEmbed(
          'Not Whitelisted',
          `${targetName} is not in the ${type} whitelist.`
        )]
      });
      return;
    }

    // Remove from whitelist
    await GuildConfigService.updateWhitelist(guildId, dbField, targetId, 'remove');

    const successEmbed = createSuccessEmbed(
      `${targetName} has been **removed** from the ${type} whitelist. They will now be subject to spam detection.`
    ).setTitle(`${Icons.REMOVE} Whitelist Updated`);

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    logger.error({ err: error }, 'Error removing from whitelist');
    await interaction.editReply({
      embeds: [createErrorEmbed('Failed to remove from whitelist. Please try again.')]
    });
  }
}
