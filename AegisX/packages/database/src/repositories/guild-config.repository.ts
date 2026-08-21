import {
  GuildConfigModel,
  type GuildConfig,
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