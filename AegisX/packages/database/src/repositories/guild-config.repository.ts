import {
  GuildConfigModel,
  type GuildConfig,
  type WhitelistPermissions,
  type AntiNukeConfig,
  type AutomodConfig,
  type LoggingConfig,
  type AutoRoleConfig,
  type VerificationConfig,
  type VanityRoleSetup,
  type WelcomeConfig,
  type TicketConfig,
  type LevelingConfig,
} from "../models/GuildConfig.js";

export async function findGuildConfig(
  guildId: string,
): Promise<GuildConfig | null> {
  return GuildConfigModel.findOne({ guildId })
    .lean<GuildConfig>()
    .exec();
}

export async function createGuildConfig(
  guildId: string,
): Promise<GuildConfig> {
  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    {
      $setOnInsert: {
        guildId,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) {
    throw new Error(`Failed to create guild config: ${guildId}`);
  }

  return config;
}

export async function updateGuildPrefix(
  guildId: string,
  prefix: string,
): Promise<GuildConfig> {
  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: { prefix } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to update prefix for guild: ${guildId}`);
  return config;
}

export async function updateAntiNukeConfig(
  guildId: string,
  antiNuke: Partial<AntiNukeConfig>,
): Promise<GuildConfig> {
  const updateQuery: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(antiNuke)) {
    if (value !== undefined) {
      updateQuery[`security.antiNuke.${key}`] = value;
    }
  }

  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: updateQuery },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to update antinuke config: ${guildId}`);
  return config;
}

export async function setWhitelistedUser(
  guildId: string,
  userId: string,
  permissions: WhitelistPermissions,
): Promise<GuildConfig> {
  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: { [`security.whitelistedUsers.${userId}`]: permissions } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to set whitelist for ${userId} in ${guildId}`);
  return config;
}

export async function removeWhitelistedUser(
  guildId: string,
  userId: string,
): Promise<GuildConfig> {
  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $unset: { [`security.whitelistedUsers.${userId}`]: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to remove whitelist for ${userId} in ${guildId}`);
  return config;
}

export async function resetWhitelistedUsers(
  guildId: string,
): Promise<GuildConfig> {
  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: { "security.whitelistedUsers": {} } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to reset whitelist in ${guildId}`);
  return config;
}

export async function setExtraOwner(
  guildId: string,
  userId: string,
): Promise<GuildConfig> {
  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $addToSet: { "security.extraOwners": userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to set extra owner in ${guildId}`);
  return config;
}

export async function removeExtraOwner(
  guildId: string,
  userId: string,
): Promise<GuildConfig> {
  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $pull: { "security.extraOwners": userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to remove extra owner in ${guildId}`);
  return config;
}

export async function resetExtraOwners(
  guildId: string,
): Promise<GuildConfig> {
  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: { "security.extraOwners": [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to reset extra owners in ${guildId}`);
  return config;
}

export async function updateAutomodConfig(
  guildId: string,
  data: Partial<AutomodConfig>,
): Promise<GuildConfig> {
  const updateQuery: Record<string, unknown> = {};
  if (data.enabled !== undefined) updateQuery["automod.enabled"] = data.enabled;
  if (data.punishments !== undefined) updateQuery["automod.punishments"] = data.punishments;
  if (data.ignoredRoles !== undefined) updateQuery["automod.ignoredRoles"] = data.ignoredRoles;
  if (data.ignoredChannels !== undefined) updateQuery["automod.ignoredChannels"] = data.ignoredChannels;
  if (data.ignoredUsers !== undefined) updateQuery["automod.ignoredUsers"] = data.ignoredUsers;
  if (data.loggingChannel !== undefined) updateQuery["automod.loggingChannel"] = data.loggingChannel;

  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: updateQuery },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to update automod in ${guildId}`);
  return config;
}

export async function updateLoggingConfig(
  guildId: string,
  data: Partial<LoggingConfig>,
): Promise<GuildConfig> {
  const updateQuery: Record<string, unknown> = {};
  if (data.logEnabled !== undefined) updateQuery["logging.logEnabled"] = data.logEnabled;
  if (data.logChannels !== undefined) updateQuery["logging.logChannels"] = data.logChannels;
  if (data.ignoreChannels !== undefined) updateQuery["logging.ignoreChannels"] = data.ignoreChannels;
  if (data.ignoreRoles !== undefined) updateQuery["logging.ignoreRoles"] = data.ignoreRoles;
  if (data.ignoreUsers !== undefined) updateQuery["logging.ignoreUsers"] = data.ignoreUsers;
  if (data.autoDeleteDuration !== undefined) updateQuery["logging.autoDeleteDuration"] = data.autoDeleteDuration;

  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: updateQuery },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to update logging in ${guildId}`);
  return config;
}

export async function updateAutoRoleConfig(
  guildId: string,
  data: Partial<AutoRoleConfig>,
): Promise<GuildConfig> {
  const updateQuery: Record<string, unknown> = {};
  if (data.bots !== undefined) updateQuery["autorole.bots"] = data.bots;
  if (data.humans !== undefined) updateQuery["autorole.humans"] = data.humans;

  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: updateQuery },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to update autorole in ${guildId}`);
  return config;
}

export async function updateVerificationConfig(
  guildId: string,
  data: Partial<VerificationConfig>,
): Promise<GuildConfig> {
  const updateQuery: Record<string, unknown> = {};
  if (data.enabled !== undefined) updateQuery["verification.enabled"] = data.enabled;
  if (data.verificationChannelId !== undefined) updateQuery["verification.verificationChannelId"] = data.verificationChannelId;
  if (data.verifiedRoleId !== undefined) updateQuery["verification.verifiedRoleId"] = data.verifiedRoleId;
  if (data.logChannelId !== undefined) updateQuery["verification.logChannelId"] = data.logChannelId;
  if (data.verificationMethod !== undefined) updateQuery["verification.verificationMethod"] = data.verificationMethod;

  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: updateQuery },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to update verification in ${guildId}`);
  return config;
}

export async function setVanityRole(
  guildId: string,
  vanitySetup: VanityRoleSetup,
): Promise<GuildConfig> {
  await GuildConfigModel.updateOne(
    { guildId },
    { $pull: { vanityRoles: { vanity: vanitySetup.vanity.toLowerCase() } } },
  );

  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $push: { vanityRoles: vanitySetup } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to set vanity role in ${guildId}`);
  return config;
}

export async function removeVanityRole(
  guildId: string,
  vanity: string,
): Promise<GuildConfig> {
  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $pull: { vanityRoles: { vanity: vanity.toLowerCase() } } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to remove vanity role in ${guildId}`);
  return config;
}

export async function updateWelcomeConfig(
  guildId: string,
  data: Partial<WelcomeConfig>,
): Promise<GuildConfig> {
  const updateQuery: Record<string, unknown> = {};
  if (data.welcomeType !== undefined) updateQuery["welcome.welcomeType"] = data.welcomeType;
  if (data.welcomeMessage !== undefined) updateQuery["welcome.welcomeMessage"] = data.welcomeMessage;
  if (data.channelId !== undefined) updateQuery["welcome.channelId"] = data.channelId;
  if (data.embedData !== undefined) updateQuery["welcome.embedData"] = data.embedData;
  if (data.autoDeleteDuration !== undefined) updateQuery["welcome.autoDeleteDuration"] = data.autoDeleteDuration;

  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: updateQuery },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to update welcome in ${guildId}`);
  return config;
}

export async function deleteWelcomeConfig(
  guildId: string,
): Promise<GuildConfig> {
  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    {
      $set: {
        welcome: {
          welcomeType: "simple",
          welcomeMessage: null,
          channelId: null,
          embedData: null,
          autoDeleteDuration: null,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to delete welcome in ${guildId}`);
  return config;
}

export async function updateTicketConfig(
  guildId: string,
  data: Partial<TicketConfig>,
): Promise<GuildConfig> {
  const updateQuery: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateQuery[`tickets.${key}`] = value;
    }
  }

  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: updateQuery },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to update tickets in ${guildId}`);
  return config;
}

export async function updateLevelingConfig(
  guildId: string,
  data: Partial<LevelingConfig>,
): Promise<GuildConfig> {
  const updateQuery: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateQuery[`leveling.${key}`] = value;
    }
  }

  const config = await GuildConfigModel.findOneAndUpdate(
    { guildId },
    { $set: updateQuery },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<GuildConfig>()
    .exec();

  if (!config) throw new Error(`Failed to update leveling in ${guildId}`);
  return config;
}