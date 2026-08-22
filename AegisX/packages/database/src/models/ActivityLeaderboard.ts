import mongoose, { Schema, Document } from "mongoose";

export interface ActivityLeaderboard {
  guildId: string;
  userId: string;
  // Message counts
  messagesDaily: number;
  messagesWeekly: number;
  messagesMonthly: number;
  messagesTotal: number;
  // Voice seconds
  voiceDaily: number;
  voiceWeekly: number;
  voiceMonthly: number;
  voiceTotal: number;
  // Timestamps
  lastActiveAt: Date;
  lastDailyResetAt: Date;
  lastWeeklyResetAt: Date;
  lastMonthlyResetAt: Date;
}

export type ActivityLeaderboardDocument = ActivityLeaderboard & Document;

const ActivityLeaderboardSchema = new Schema<ActivityLeaderboard>(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    messagesDaily: { type: Number, default: 0 },
    messagesWeekly: { type: Number, default: 0 },
    messagesMonthly: { type: Number, default: 0 },
    messagesTotal: { type: Number, default: 0 },
    voiceDaily: { type: Number, default: 0 },
    voiceWeekly: { type: Number, default: 0 },
    voiceMonthly: { type: Number, default: 0 },
    voiceTotal: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: () => new Date() },
    lastDailyResetAt: { type: Date, default: () => new Date() },
    lastWeeklyResetAt: { type: Date, default: () => new Date() },
    lastMonthlyResetAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

ActivityLeaderboardSchema.index({ guildId: 1, userId: 1 }, { unique: true });
ActivityLeaderboardSchema.index({ guildId: 1, messagesWeekly: -1 });
ActivityLeaderboardSchema.index({ guildId: 1, messagesTotal: -1 });
ActivityLeaderboardSchema.index({ guildId: 1, voiceWeekly: -1 });
ActivityLeaderboardSchema.index({ guildId: 1, voiceTotal: -1 });

export const ActivityLeaderboardModel =
  mongoose.models.ActivityLeaderboard ??
  mongoose.model<ActivityLeaderboard>("ActivityLeaderboard", ActivityLeaderboardSchema);
