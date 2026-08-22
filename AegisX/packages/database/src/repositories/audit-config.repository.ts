import {
  AuditConfigHistoryModel,
  type AuditConfigHistory,
} from "../models/AuditConfigHistory.js";

export async function logConfigChange(
  data: Omit<AuditConfigHistory, "createdAt">,
): Promise<AuditConfigHistory> {
  const created = await AuditConfigHistoryModel.create({
    ...data,
    createdAt: new Date(),
  });
  return created.toObject();
}

export async function getGuildConfigAuditHistory(
  guildId: string,
  limit = 50,
): Promise<AuditConfigHistory[]> {
  return AuditConfigHistoryModel.find({ guildId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<AuditConfigHistory[]>()
    .exec();
}
