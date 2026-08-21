import type {
  Guild,
  GuildMember,
} from "discord.js";

export class ExecutorResolverService {
  async resolve(
    guild: Guild,
    executorId: string,
  ): Promise<GuildMember | null> {
    try {
      return await guild.members.fetch(executorId);
    } catch (error) {
      console.warn(
        `⚠️ Failed to resolve executor ${executorId} in guild ${guild.id}:`,
        error,
      );

      return null;
    }
  }
}

export const executorResolverService =
  new ExecutorResolverService();