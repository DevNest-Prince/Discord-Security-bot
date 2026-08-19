import { EmbedBuilder, User } from 'discord.js';
import { Colors } from '../colors.js';
import { Icons } from '../icons.js';

/**
 * Production-grade Embed Builders
 * Provides consistent, professional embed styling across the bot
 */

export function createBaseEmbed() {
  return new EmbedBuilder().setTimestamp();
}

export function createSuccessEmbed(description: string) {
  return createBaseEmbed()
    .setColor(Colors.SUCCESS)
    .setDescription(`${Icons.SUCCESS} ${description}`);
}

export function createErrorEmbed(description: string) {
  return createBaseEmbed()
    .setColor(Colors.ERROR)
    .setDescription(`${Icons.ERROR} ${description}`);
}

export function createWarningEmbed(description: string) {
  return createBaseEmbed()
    .setColor(Colors.WARNING)
    .setDescription(`${Icons.WARNING} ${description}`);
}

export function createInfoEmbed(title: string, description: string) {
  return createBaseEmbed()
    .setColor(Colors.INFO)
    .setTitle(`${Icons.INFO} ${title}`)
    .setDescription(description);
}

/**
 * Security-themed embeds
 */
export function createSecurityEmbed(title: string, description: string) {
  return createBaseEmbed()
    .setColor(Colors.SECURITY)
    .setTitle(`${Icons.SECURITY} ${title}`)
    .setDescription(description);
}

/**
 * Modern command result embed with status
 */
export function createCommandResultEmbed(
  status: 'success' | 'error' | 'warning',
  title: string,
  description: string
) {
  const baseEmbed = createBaseEmbed().setTitle(title).setDescription(description);

  switch (status) {
    case 'success':
      return baseEmbed.setColor(Colors.SUCCESS);
    case 'error':
      return baseEmbed.setColor(Colors.ERROR);
    case 'warning':
      return baseEmbed.setColor(Colors.WARNING);
    default:
      return baseEmbed.setColor(Colors.INFO);
  }
}

/**
 * User profile embed (for userinfo command)
 */
export function createUserProfileEmbed(
  user: User,
  createdAt: Date,
  joinedAt?: Date,
  roles?: string[]
) {
  return createBaseEmbed()
    .setColor(Colors.BLURPLE)
    .setTitle(`${Icons.USER} ${user.username}`)
    .setDescription(`User profile for <@${user.id}>`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: '🆔 User ID',
        value: `\`${user.id}\``,
        inline: true
      },
      {
        name: '📅 Account Created',
        value: `<t:${Math.floor(createdAt.getTime() / 1000)}:D> (<t:${Math.floor(createdAt.getTime() / 1000)}:R>)`,
        inline: true
      },
      {
        name: '🤖 Bot Account',
        value: user.bot ? 'Yes' : 'No',
        inline: true
      },
      {
        name: joinedAt ? '📥 Joined Server' : '📥 Server Join Date',
        value: joinedAt 
          ? `<t:${Math.floor(joinedAt.getTime() / 1000)}:D> (<t:${Math.floor(joinedAt.getTime() / 1000)}:R>)`
          : 'Unknown',
        inline: true
      },
      {
        name: '🎭 Roles',
        value: roles && roles.length > 0 ? roles.join(', ') : 'None',
        inline: false
      }
    );
}

/**
 * Guild info embed (for serverinfo command)
 */
export function createGuildInfoEmbed(
  guildName: string,
  guildId: string,
  owner?: string,
  memberCount?: number,
  channels?: number,
  roles?: number,
  createdAt?: Date,
  icon?: string | null,
  boostLevel?: number,
  boostCount?: number
) {
  const createdTimestamp = createdAt ? Math.floor(createdAt.getTime() / 1000) : null;

  const embed = createBaseEmbed()
    .setColor(Colors.BRAND)
    .setTitle(`${Icons.SERVER} ${guildName} - Server Information`)
    .setDescription('Detailed guild statistics and information:');

  if (icon) {
    embed.setThumbnail(icon);
  }

  embed.addFields(
    {
      name: '🆔 Server ID',
      value: `\`${guildId}\``,
      inline: true
    },
    {
      name: '👑 Owner',
      value: owner || 'Unknown',
      inline: true
    },
    {
      name: '👥 Members',
      value: `\`${memberCount || 0}\``,
      inline: true
    }
  );

  if (channels !== undefined) {
    embed.addFields({
      name: '💬 Channels',
      value: `\`${channels}\``,
      inline: true
    });
  }

  if (roles !== undefined) {
    embed.addFields({
      name: '🎭 Roles',
      value: `\`${roles}\``,
      inline: true
    });
  }

  if (createdTimestamp) {
    embed.addFields({
      name: '📅 Created On',
      value: `<t:${createdTimestamp}:D> (<t:${createdTimestamp}:R>)`,
      inline: true
    });
  }

  if (boostLevel !== undefined) {
    embed.addFields({
      name: '🚀 Boost Status',
      value: `Level ${boostLevel} (${boostCount || 0} Boosts)`,
      inline: false
    });
  }

  return embed;
}

/**
 * System status embed (for ping command)
 */
export function createSystemStatusEmbed(
  wsLatency: number,
  dbStatus: string,
  redisStatus: string,
  additionalInfo?: { [key: string]: string }
) {
  const embed = createBaseEmbed()
    .setColor(Colors.GREEN)
    .setTitle(`${Icons.BOT} System Operational`)
    .setDescription('Current latency and service status:')
    .addFields(
      {
        name: `${Icons.PING} Bot Latency`,
        value: `\`${wsLatency}ms\``,
        inline: true
      },
      {
        name: '📡 WebSocket',
        value: `\`${wsLatency}ms\``,
        inline: true
      },
      {
        name: '💾 MongoDB',
        value: `\`${dbStatus}\``,
        inline: true
      },
      {
        name: '⚡ Redis',
        value: `\`${redisStatus}\``,
        inline: true
      }
    );

  if (additionalInfo) {
    Object.entries(additionalInfo).forEach(([key, value]) => {
      embed.addFields({ name: key, value: `\`${value}\``, inline: true });
    });
  }

  return embed;
}

/**
 * Whitelist management embed
 */
export function createWhitelistEmbed(
  roles: string[],
  users: string[],
  channels: string[],
  categories: string[]
) {
  return createSecurityEmbed(`${Icons.WHITELIST} Automod Whitelist`, 'Current whitelist configuration:')
    .addFields(
      {
        name: `${Icons.ROLE} Whitelisted Roles`,
        value: roles.length > 0 ? roles.join(', ') : 'None',
        inline: false
      },
      {
        name: `${Icons.USER} Whitelisted Users`,
        value: users.length > 0 ? users.join(', ') : 'None',
        inline: false
      },
      {
        name: `${Icons.CHANNEL} Whitelisted Channels`,
        value: channels.length > 0 ? channels.join(', ') : 'None',
        inline: false
      },
      {
        name: `${Icons.CATEGORY} Whitelisted Categories`,
        value: categories.length > 0 ? categories.join(', ') : 'None',
        inline: false
      }
    );
}

/**
 * Help menu embed builder
 */
export function createHelpCategoryEmbed(
  category: string,
  icon: string,
  description: string,
  commands: Array<{ name: string; description: string }>
) {
  const embed = createInfoEmbed(`${icon} ${category} Commands`, description);

  commands.forEach(cmd => {
    embed.addFields({ name: `\`/${cmd.name}\``, value: cmd.description, inline: false });
  });

  return embed;
}

/**
 * Confirmation embed for important actions
 */
export function createConfirmationEmbed(title: string, description: string) {
  return createBaseEmbed()
    .setColor(Colors.ORANGE)
    .setTitle(`${Icons.WARNING} ${title}`)
    .setDescription(description);
}

/**
 * Audit/action log embed
 */
export function createAuditEmbed(
  action: string,
  actor: string,
  target: string,
  reason?: string,
  timestamp?: Date
) {
  const embed = createBaseEmbed()
    .setColor(Colors.NEUTRAL)
    .setTitle(`📋 ${action}`)
    .addFields(
      {
        name: 'Actor',
        value: actor,
        inline: true
      },
      {
        name: 'Target',
        value: target,
        inline: true
      }
    );

  if (reason) {
    embed.addFields({ name: 'Reason', value: reason, inline: false });
  }

  if (timestamp) {
    const ts = Math.floor(timestamp.getTime() / 1000);
    embed.addFields({ name: 'Time', value: `<t:${ts}:F>`, inline: true });
  }

  return embed;
}