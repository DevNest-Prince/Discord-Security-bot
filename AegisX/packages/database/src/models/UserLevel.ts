import mongoose, { Schema, Document } from "mongoose";

export interface UserLevel {
  guildId: string;
  userId: string;
  xp: number;
  level: number;
  messages: number;
  voiceSeconds: number;
  lastXpAt: Date;
}

export type UserLevelDocument = UserLevel & Document;

const UserLevelSchema = new Schema<UserLevel>(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    voiceSeconds: { type: Number, default: 0 },
    lastXpAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

UserLevelSchema.index({ guildId: 1, userId: 1 }, { unique: true });
UserLevelSchema.index({ guildId: 1, xp: -1 });

export const UserLevelModel =
  mongoose.models.UserLevel ??
  mongoose.model<UserLevel>("UserLevel", UserLevelSchema);
