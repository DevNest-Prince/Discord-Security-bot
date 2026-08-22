import { WarnRecordModel, type WarnRecord } from "../models/WarnRecord.js";

export async function addWarning(data: Omit<WarnRecord, "createdAt">): Promise<WarnRecord> {
  const created = await WarnRecordModel.create({
    ...data,
    createdAt: new Date(),
  });
  return created.toObject();
}

export async function getActiveWarnings(guildId: string, userId: string): Promise<WarnRecord[]> {
  const now = new Date();
  return WarnRecordModel.find({
    guildId,
    userId,
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ createdAt: -1 })
    .lean<WarnRecord[]>()
    .exec();
}

export async function getActiveWarningPoints(guildId: string, userId: string): Promise<number> {
  const warns = await getActiveWarnings(guildId, userId);
  return warns.reduce((acc, w) => acc + (w.points || 1), 0);
}

export async function clearUserWarnings(guildId: string, userId: string): Promise<number> {
  const res = await WarnRecordModel.updateMany(
    { guildId, userId, active: true },
    { $set: { active: false } },
  ).exec();
  return res.modifiedCount;
}

export async function removeWarningByCaseId(guildId: string, caseId: number): Promise<boolean> {
  const res = await WarnRecordModel.updateOne(
    { guildId, caseId, active: true },
    { $set: { active: false } },
  ).exec();
  return res.modifiedCount > 0;
}
