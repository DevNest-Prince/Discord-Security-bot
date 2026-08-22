import { VoiceBanRecordModel, type VoiceBanRecord } from "../models/VoiceBanRecord.js";

export async function addVoiceBan(data: {
  guildId: string;
  userId: string;
  moderatorId: string;
  reason?: string;
}): Promise<VoiceBanRecord> {
  return VoiceBanRecordModel.findOneAndUpdate(
    { guildId: data.guildId, userId: data.userId },
    {
      $set: {
        moderatorId: data.moderatorId,
        reason: data.reason || "No reason provided.",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

export async function removeVoiceBan(guildId: string, userId: string): Promise<boolean> {
  const res = await VoiceBanRecordModel.deleteOne({ guildId, userId }).exec();
  return (res.deletedCount ?? 0) > 0;
}

export async function isVoiceBanned(guildId: string, userId: string): Promise<boolean> {
  const count = await VoiceBanRecordModel.countDocuments({ guildId, userId }).exec();
  return count > 0;
}

export async function listVoiceBans(guildId: string): Promise<VoiceBanRecord[]> {
  return VoiceBanRecordModel.find({ guildId }).sort({ createdAt: -1 }).exec();
}

export async function clearAllVoiceBans(guildId: string): Promise<number> {
  const res = await VoiceBanRecordModel.deleteMany({ guildId }).exec();
  return res.deletedCount ?? 0;
}
