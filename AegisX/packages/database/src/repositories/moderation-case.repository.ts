import { ModerationCaseModel, type ModerationCase } from "../models/ModerationCase.js";

export async function getNextCaseId(guildId: string): Promise<number> {
  const lastCase = await ModerationCaseModel.findOne({ guildId })
    .sort({ caseId: -1 })
    .select("caseId")
    .lean<{ caseId: number } | null>()
    .exec();

  return (lastCase?.caseId ?? 0) + 1;
}

export async function createModerationCase(
  data: Omit<ModerationCase, "caseId" | "createdAt"> & { caseId?: number },
): Promise<ModerationCase> {
  const caseId = data.caseId ?? (await getNextCaseId(data.guildId));
  const created = await ModerationCaseModel.create({
    ...data,
    caseId,
    createdAt: new Date(),
  });
  return created.toObject();
}

export async function getModerationCase(guildId: string, caseId: number): Promise<ModerationCase | null> {
  return ModerationCaseModel.findOne({ guildId, caseId })
    .lean<ModerationCase | null>()
    .exec();
}

export async function getUserModerationHistory(
  guildId: string,
  targetId: string,
  limit = 20,
): Promise<ModerationCase[]> {
  return ModerationCaseModel.find({ guildId, targetId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<ModerationCase[]>()
    .exec();
}

export async function updateCaseReason(
  guildId: string,
  caseId: number,
  reason: string,
  moderatorId?: string,
): Promise<ModerationCase | null> {
  const updateData: any = { reason };
  if (moderatorId) updateData.moderatorId = moderatorId;
  return ModerationCaseModel.findOneAndUpdate(
    { guildId, caseId },
    { $set: updateData },
    { new: true },
  )
    .lean<ModerationCase | null>()
    .exec();
}

export async function getGuildCaseCount(guildId: string): Promise<number> {
  return ModerationCaseModel.countDocuments({ guildId }).exec();
}
