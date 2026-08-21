import {
  createGuild,
  findGuild,
} from "../repositories/guild.repository.js";

export async function getGuild(guildId: string) {
  const guild = await findGuild(guildId);

  if (guild) {
    return guild;
  }

  return createGuild(guildId);
}