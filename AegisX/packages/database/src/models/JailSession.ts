import mongoose, { Schema, Document } from "mongoose";

export interface JailSession {
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  savedRoleIds: string[];
  jailRoleId: string;
  durationSeconds?: number | null;
  expiresAt?: Date | null;
  active: boolean;
  caseId: number;
  unjailedAt?: Date | null;
  unjailedBy?: string | null;
  unjailReason?: string | null;
  createdAt: Date;
}

export type JailSessionDocument = JailSession & Document;

const JailSessionSchema = new Schema<JailSession>(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, default: "Server quarantine / jail." },
    savedRoleIds: { type: [String], default: [] },
    jailRoleId: { type: String, required: true },
    durationSeconds: { type: Number, default: null },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
    caseId: { type: Number, required: true },
    unjailedAt: { type: Date, default: null },
    unjailedBy: { type: String, default: null },
    unjailReason: { type: String, default: null },
    createdAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

JailSessionSchema.index({ guildId: 1, userId: 1, active: 1 });
JailSessionSchema.index({ active: 1, expiresAt: 1 });

export const JailSessionModel =
  mongoose.models.JailSession ??
  mongoose.model<JailSession>("JailSession", JailSessionSchema);
