import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface VoiceBanRecord extends Document {
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  createdAt: Date;
}

const VoiceBanRecordSchema = new Schema<VoiceBanRecord>(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, default: "No reason provided." },
  },
  { timestamps: true, versionKey: false },
);

VoiceBanRecordSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export const VoiceBanRecordModel: Model<VoiceBanRecord> =
  mongoose.models.VoiceBanRecord ||
  mongoose.model<VoiceBanRecord>("VoiceBanRecord", VoiceBanRecordSchema);
