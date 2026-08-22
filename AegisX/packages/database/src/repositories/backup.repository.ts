import { GuildBackupModel, type GuildBackup } from "../models/GuildBackup.js";

export async function createBackup(data: Omit<GuildBackup, "createdAt">): Promise<GuildBackup> {
  const doc = await GuildBackupModel.create(data);
  return doc.toObject();
}

export async function getBackup(backupId: string): Promise<GuildBackup | null> {
  return GuildBackupModel.findOne({ backupId }).lean<GuildBackup>().exec();
}

export async function listGuildBackups(guildId: string): Promise<GuildBackup[]> {
  return GuildBackupModel.find({ guildId }).sort({ createdAt: -1 }).lean<GuildBackup[]>().exec();
}

export async function deleteBackup(backupId: string): Promise<boolean> {
  const res = await GuildBackupModel.deleteOne({ backupId }).exec();
  return (res.deletedCount ?? 0) > 0;
}
