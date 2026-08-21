import { GuildModel } from "../models/Guild.js";

export async function findGuild(guildId: string) {
  return GuildModel.findOne({ guildId }).lean();
}

export async function createGuild(guildId: string) {
  return GuildModel.create({
    guildId,
  });
}

export async function findOrCreateGuild(guildId: string) {
  const existingGuild = await findGuild(guildId);

  if (existingGuild) {
    return existingGuild;
  }

  return createGuild(guildId);
}