import mongoose, { Schema, Document } from "mongoose";

export interface WarnRecord {
  guildId: string;
  userId: string;
  moderatorId: string;
  points: number;
  reason: string;
  active: boolean;
  expiresAt?: Date | null;
  caseId: number;
  createdAt: Date;
}

export type WarnRecordDocument = WarnRecord & Document;

const WarnRecordSchema = new Schema<WarnRecord>(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    points: { type: Number, default: 1 },
    reason: { type: String, default: "No reason provided." },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    caseId: { type: Number, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

WarnRecordSchema.index({ guildId: 1, userId: 1, active: 1 });

export const WarnRecordModel =
  mongoose.models.WarnRecord ??
  mongoose.model<WarnRecord>("WarnRecord", WarnRecordSchema);
