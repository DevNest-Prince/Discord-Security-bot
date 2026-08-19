import { Message, PermissionsBitField } from 'discord.js';
import { GuildConfigService } from '../../../services/GuildConfigService.js';
import { createInfoEmbed, createErrorEmbed } from '../../../ui/embeds/builders.js';

export const WhitelistCommand = {
  name: 'whitelist',
  description: 'Manage or view automod whitelists',
  aliases: ['wl'],

  async execute(context: Message, args: string[]) {
    if (!context.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const errEmbed = createErrorEmbed('You need Administrator permission to use this command!');
      await context.reply({ embeds: [errEmbed] });
      return;
    }

    const guild = context.guild!;
    const guildId = guild.id;
    const config = await GuildConfigService.getConfig(guildId);
    
    const spamWhitelist = (config?.automod?.spam || {}) as any;
    let whitelistedRoles: string[] = spamWhitelist.whitelistedRoles || [];
    let whitelistedMembers: string[] = spamWhitelist.whitelistedMembers || [];
    let whitelistedChannels: string[] = spamWhitelist.whitelistedChannels || [];
    let whitelistedCategories: string[] = spamWhitelist.whitelistedCategories || [];

    const action = args[0]?.toLowerCase(); // add, remove, view (or empty)

    // 1. VIEW WHITELIST LIST & AUTO-CLEANUP OF DELETED ITEMS
    if (!action || action === 'view' || action === 'list') {
      // Auto-cleanup invalid entries
      const validRoles = whitelistedRoles.filter(id => guild.roles.cache.has(id));
      const validChannels = whitelistedChannels.filter(id => guild.channels.cache.has(id));
      const validCategories = whitelistedCategories.filter(id => {
        const ch = guild.channels.cache.get(id);
        return ch && ch.type === 4;
      });

      // Agar koi item delete ho gaya tha, toh database se bhi hata do quietly
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

      const rolesList = whitelistedRoles.length ? whitelistedRoles.map((id: string) => `<@&${id}>`).join(', ') : 'None';
      const usersList = whitelistedMembers.length ? whitelistedMembers.map((id: string) => `<@${id}>`).join(', ') : 'None';
      const channelsList = whitelistedChannels.length ? whitelistedChannels.map((id: string) => `<#${id}>`).join(', ') : 'None';
      const categoriesList = whitelistedCategories.length ? whitelistedCategories.map((id: string) => `ID: \`${id}\``).join(', ') : 'None';

      const listEmbed = createInfoEmbed('🛡️ Automod Spam Whitelist', 'Here are the current whitelisted items for this server:')
        .addFields(
          { name: '🎭 Whitelisted Roles', value: rolesList, inline: false },
          { name: '👤 Whitelisted Users', value: usersList, inline: false },
          { name: '💬 Whitelisted Channels', value: channelsList, inline: false },
          { name: '📁 Whitelisted Categories', value: categoriesList, inline: false }
        );

      await context.reply({ embeds: [listEmbed] });
      return;
    }

    const targetType = args[1]?.toLowerCase(); // role / user / channel / category

    if (!['add', 'remove'].includes(action) || !['role', 'user', 'channel', 'category'].includes(targetType)) {
      const helpEmbed = createInfoEmbed(
        'Whitelist Command Usage', 
        'Proper usage:\n' +
        '`p!whitelist` (To view list)\n' +
        '`p!whitelist add role @RoleName` or `<RoleID>`\n' +
        '`p!whitelist remove role @RoleName` or `<RoleID>`\n' +
        '`p!whitelist add user @Username` or `<UserID>`\n' +
        '`p!whitelist add channel #channel-name` or `<ChannelID>`\n' +
        '`p!whitelist add category <CategoryID>`'
      );
      await context.reply({ embeds: [helpEmbed] });
      return;
    }

    let targetId = '';
    let dbField: 'whitelistedMembers' | 'whitelistedRoles' | 'whitelistedChannels' | 'whitelistedCategories' = 'whitelistedRoles';
    let currentList: string[] = [];

    const rawInput = args[2]?.replace(/[<@&#>]/g, '');

    if (targetType === 'role') {
      dbField = 'whitelistedRoles';
      currentList = whitelistedRoles;
      const role = context.mentions.roles.first() || guild.roles.cache.get(rawInput);
      if (!role && action === 'remove' && rawInput) {
        targetId = rawInput;
      } else if (!role) {
        await context.reply({ embeds: [createErrorEmbed('Please mention a valid role or provide a valid Role ID!')] });
        return;
      } else {
        targetId = role.id;
      }
    } 
    else if (targetType === 'user') {
      dbField = 'whitelistedMembers';
      currentList = whitelistedMembers;
      const user = context.mentions.users.first() || await guild.client.users.fetch(rawInput).catch(() => null);
      if (!user && action === 'remove' && rawInput) {
        targetId = rawInput;
      } else if (!user) {
        await context.reply({ embeds: [createErrorEmbed('Please mention a valid user or provide a valid User ID!')] });
        return;
      } else {
        targetId = user.id;
      }
    } 
    else if (targetType === 'channel') {
      dbField = 'whitelistedChannels';
      currentList = whitelistedChannels;
      const channel = context.mentions.channels.first() || guild.channels.cache.get(rawInput);
      if (!channel && action === 'remove' && rawInput) {
        targetId = rawInput;
      } else if (!channel) {
        await context.reply({ embeds: [createErrorEmbed('Please mention a valid channel or provide a valid Channel ID!')] });
        return;
      } else {
        targetId = channel.id;
      }
    }
    else if (targetType === 'category') {
      dbField = 'whitelistedCategories';
      currentList = whitelistedCategories;
      const channel = guild.channels.cache.get(rawInput);
      if ((!channel || channel.type !== 4) && action === 'remove' && rawInput) {
        targetId = rawInput;
      } else if (!channel || channel.type !== 4) {
        await context.reply({ embeds: [createErrorEmbed('Please provide a valid Category ID!')] });
        return;
      } else {
        targetId = channel.id;
      }
    }

    if (action === 'add' && currentList.includes(targetId)) {
      await context.reply({ embeds: [createErrorEmbed(`This ${targetType} is **already** in the spam whitelist!`)] });
      return;
    }
    if (action === 'remove' && !currentList.includes(targetId)) {
      await context.reply({ embeds: [createErrorEmbed(`This ${targetType} is **not** present in the spam whitelist!`)] });
      return;
    }

    await GuildConfigService.updateWhitelist(guildId, dbField, targetId, action as 'add' | 'remove');

    const successEmbed = createInfoEmbed(
      'Whitelist Updated Successfully ✅', 
      `The ${targetType} has been successfully **${action}ed** from the spam whitelist.`
    );
    await context.reply({ embeds: [successEmbed] });
  }
};