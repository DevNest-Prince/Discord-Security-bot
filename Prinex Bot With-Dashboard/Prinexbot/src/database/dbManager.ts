import { dbManager } from './connection';

export class BotDatabase {
  public static async getGuildSettings(guildId: string) {
    const db = await dbManager.connect();
    return await db.collection('guild_settings').findOne({ guildId });
  }

  public static async updateGuildSettings(guildId: string, data: object) {
    const db = await dbManager.connect();
    return await db.collection('guild_settings').updateOne(
      { guildId },
      { $set: data },
      { upsert: true }
    );
  }
}