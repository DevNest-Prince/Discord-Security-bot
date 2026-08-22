import { UserLevelModel, type UserLevel } from "../models/UserLevel.js";

export async function getUserLevel(
  guildId: string,
  userId: string,
): Promise<UserLevel> {
  const existing = await UserLevelModel.findOne({ guildId, userId }).lean<UserLevel>().exec();
  if (existing) return existing;

  const created = await UserLevelModel.create({
    guildId,
    userId,
    xp: 0,
    level: 0,
    messages: 0,
    voiceSeconds: 0,
    lastXpAt: new Date(),
  });
  return created.toObject();
}


export async function addMessageXp(
  guildId: string,
  userId: string,
  xpEarned: number,
): Promise<{ user: UserLevel; leveledUp: boolean; newLevel: number }> {
  const current = await getUserLevel(guildId, userId);
  const newXp = current.xp + xpEarned;
  const newMessages = current.messages + 1;

  // Level calculation: required XP = 5 * (lvl ^ 2) + 50 * lvl + 100
  let calculatedLevel = 0;
  while (5 * Math.pow(calculatedLevel + 1, 2) + 50 * (calculatedLevel + 1) + 100 <= newXp) {
    calculatedLevel++;
  }

  const leveledUp = calculatedLevel > current.level;

  const updated = await UserLevelModel.findOneAndUpdate(
    { guildId, userId },
    {
      $set: {
        xp: newXp,
        level: calculatedLevel,
        messages: newMessages,
        lastXpAt: new Date(),
      },
    },
    { new: true, upsert: true },
  )
    .lean<UserLevel>()
    .exec();

  return {
    user: updated!,
    leveledUp,
    newLevel: calculatedLevel,
  };
}

export async function getGuildLeaderboard(
  guildId: string,
  limit = 10,
): Promise<UserLevel[]> {
  return UserLevelModel.find({ guildId })
    .sort({ xp: -1 })
    .limit(limit)
    .lean<UserLevel[]>()
    .exec();
}

export async function getUserRank(
  guildId: string,
  userId: string,
): Promise<number> {
  const user = await getUserLevel(guildId, userId);
  const higherUsers = await UserLevelModel.countDocuments({
    guildId,
    xp: { $gt: user.xp },
  }).exec();
  return higherUsers + 1;
}
