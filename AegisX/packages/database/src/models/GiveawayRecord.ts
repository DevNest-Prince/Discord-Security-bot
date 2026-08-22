import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface GiveawayRecord extends Document {
  guildId: string;
  channelId: string;
  messageId: string;
  prize: string;
  winnerCount: number;
  hostId: string;
  requiredRoles: string[];
  exemptRoles: string[];
  minAccountAgeDays: number;
  endsAt: Date;
  ended: boolean;
  winners: string[];
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

const GiveawayRecordSchema = new Schema<GiveawayRecord>(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true, unique: true, index: true },
    prize: { type: String, required: true },
    winnerCount: { type: Number, required: true, default: 1 },
    hostId: { type: String, required: true },
    requiredRoles: { type: [String], default: [] },
    exemptRoles: { type: [String], default: [] },
    minAccountAgeDays: { type: Number, default: 0 },
    endsAt: { type: Date, required: true, index: true },
    ended: { type: Boolean, default: false, index: true },
    winners: { type: [String], default: [] },
    participants: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false },
);

export const GiveawayRecordModel: Model<GiveawayRecord> =
  mongoose.models.GiveawayRecord ||
  mongoose.model<GiveawayRecord>("GiveawayRecord", GiveawayRecordSchema);
