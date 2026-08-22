import {
  ActivityLeaderboardModel,
  type ActivityLeaderboard,
} from "../models/ActivityLeaderboard.js";

export async function recordMessageActivity(
  guildId: string,
  userId: string,
): Promise<ActivityLeaderboard> {
  const now = new Date();
  const updated = await ActivityLeaderboardModel.findOneAndUpdate(
    { guildId, userId },
    {
      $inc: {
        messagesDaily: 1,
        messagesWeekly: 1,
        messagesMonthly: 1,
        messagesTotal: 1,
      },
      $set: { lastActiveAt: now },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<ActivityLeaderboard>()
    .exec();

  return updated!;
}

export async function recordVoiceActivity(
  guildId: string,
  userId: string,
  seconds: number,
): Promise<ActivityLeaderboard> {
  const now = new Date();
  const updated = await ActivityLeaderboardModel.findOneAndUpdate(
    { guildId, userId },
    {
      $inc: {
        voiceDaily: seconds,
        voiceWeekly: seconds,
        voiceMonthly: seconds,
        voiceTotal: seconds,
      },
      $set: { lastActiveAt: now },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<ActivityLeaderboard>()
    .exec();

  return updated!;
}

export async function getLeaderboard(
  guildId: string,
  type: "messages" | "voice",
  interval: "daily" | "weekly" | "monthly" | "total" = "weekly",
  limit = 10,
): Promise<ActivityLeaderboard[]> {
  const field = `${type}${interval.charAt(0).toUpperCase() + interval.slice(1)}`;
  return ActivityLeaderboardModel.find({ guildId })
    .sort({ [field]: -1 })
    .limit(limit)
    .lean<ActivityLeaderboard[]>()
    .exec();
}

export async function getUserActivity(
  guildId: string,
  userId: string,
): Promise<ActivityLeaderboard | null> {
  return ActivityLeaderboardModel.findOne({ guildId, userId })
    .lean<ActivityLeaderboard | null>()
    .exec();
}

export async function resetLeaderboardInterval(
  interval: "daily" | "weekly" | "monthly",
): Promise<number> {
  const now = new Date();
  const updateData: any = {};
  if (interval === "daily") {
    updateData.messagesDaily = 0;
    updateData.voiceDaily = 0;
    updateData.lastDailyResetAt = now;
  } else if (interval === "weekly") {
    updateData.messagesWeekly = 0;
    updateData.voiceWeekly = 0;
    updateData.lastWeeklyResetAt = now;
  } else if (interval === "monthly") {
    updateData.messagesMonthly = 0;
    updateData.voiceMonthly = 0;
    updateData.lastMonthlyResetAt = now;
  }

  const res = await ActivityLeaderboardModel.updateMany({}, { $set: updateData }).exec();
  return res.modifiedCount;
}
