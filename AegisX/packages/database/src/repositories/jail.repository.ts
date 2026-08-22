import { JailSessionModel, type JailSession } from "../models/JailSession.js";

export async function createJailSession(data: Omit<JailSession, "createdAt">): Promise<JailSession> {
  await JailSessionModel.updateMany(
    { guildId: data.guildId, userId: data.userId, active: true },
    { $set: { active: false, unjailedAt: new Date(), unjailReason: "Overridden by new jail session" } },
  ).exec();

  const created = await JailSessionModel.create({
    ...data,
    createdAt: new Date(),
  });
  return created.toObject();
}

export async function getActiveJailSession(guildId: string, userId: string): Promise<JailSession | null> {
  return JailSessionModel.findOne({ guildId, userId, active: true })
    .lean<JailSession | null>()
    .exec();
}

export async function getExpiredJailSessions(): Promise<JailSession[]> {
  const now = new Date();
  return JailSessionModel.find({
    active: true,
    expiresAt: { $ne: null, $lte: now },
  })
    .lean<JailSession[]>()
    .exec();
}

export async function closeJailSession(
  guildId: string,
  userId: string,
  unjailedBy: string,
  unjailReason = "Manual unjail / session expired",
): Promise<JailSession | null> {
  return JailSessionModel.findOneAndUpdate(
    { guildId, userId, active: true },
    {
      $set: {
        active: false,
        unjailedAt: new Date(),
        unjailedBy,
        unjailReason,
      },
    },
    { new: true },
  )
    .lean<JailSession | null>()
    .exec();
}

export async function listActiveJails(guildId: string): Promise<JailSession[]> {
  return JailSessionModel.find({ guildId, active: true })
    .sort({ createdAt: -1 })
    .lean<JailSession[]>()
    .exec();
}

export async function getUserJailHistory(guildId: string, userId: string): Promise<JailSession[]> {
  return JailSessionModel.find({ guildId, userId })
    .sort({ createdAt: -1 })
    .lean<JailSession[]>()
    .exec();
}
