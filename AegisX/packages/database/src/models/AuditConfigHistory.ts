import mongoose, { Schema, Document } from "mongoose";

export interface AuditConfigHistory {
  guildId: string;
  actorId: string;
  actorTag: string;
  module: string;
  settingKey: string;
  previousValue: string;
  newValue: string;
  source: "dashboard" | "command";
  createdAt: Date;
}

export type AuditConfigHistoryDocument = AuditConfigHistory & Document;

const AuditConfigHistorySchema = new Schema<AuditConfigHistory>(
  {
    guildId: { type: String, required: true, index: true },
    actorId: { type: String, required: true },
    actorTag: { type: String, required: true },
    module: { type: String, required: true },
    settingKey: { type: String, required: true },
    previousValue: { type: String, default: "" },
    newValue: { type: String, default: "" },
    source: { type: String, enum: ["dashboard", "command"], default: "command" },
    createdAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

AuditConfigHistorySchema.index({ guildId: 1, createdAt: -1 });

export const AuditConfigHistoryModel =
  mongoose.models.AuditConfigHistory ??
  mongoose.model<AuditConfigHistory>("AuditConfigHistory", AuditConfigHistorySchema);
