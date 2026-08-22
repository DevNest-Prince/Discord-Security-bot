import mongoose, { Schema, Document } from "mongoose";

export interface VoiceSession {
  guildId: string;
  channelId: string;
  ownerId: string;
  channelName: string;
  userLimit: number;
  isLocked: boolean;
  isHidden: boolean;
  allowedUserIds: string[];
  deniedUserIds: string[];
  createdAt: Date;
}

export type VoiceSessionDocument = VoiceSession & Document;

const VoiceSessionSchema = new Schema<VoiceSession>(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    channelName: { type: String, required: true },
    userLimit: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    allowedUserIds: { type: [String], default: [] },
    deniedUserIds: { type: [String], default: [] },
    createdAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

VoiceSessionSchema.index({ guildId: 1, channelId: 1 }, { unique: true });

export const VoiceSessionModel =
  mongoose.models.VoiceSession ??
  mongoose.model<VoiceSession>("VoiceSession", VoiceSessionSchema);
