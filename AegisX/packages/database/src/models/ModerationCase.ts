import mongoose, { Schema, Document } from "mongoose";

export interface ModerationCase {
  guildId: string;
  caseId: number;
  targetId: string;
  targetTag: string;
  moderatorId: string;
  moderatorTag: string;
  action: "ban" | "unban" | "kick" | "softban" | "mute" | "unmute" | "timeout" | "warn" | "unwarn" | "jail" | "unjail" | "purge" | "lock" | "unlock";
  reason: string;
  durationSeconds?: number | null;
  expiresAt?: Date | null;
  status: "active" | "expired" | "reverted" | "completed";
  source: "command" | "automod" | "antinuke" | "antiraid" | "antibetray" | "limits";
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type ModerationCaseDocument = ModerationCase & Document;

const ModerationCaseSchema = new Schema<ModerationCase>(
  {
    guildId: { type: String, required: true, index: true },
    caseId: { type: Number, required: true, index: true },
    targetId: { type: String, required: true, index: true },
    targetTag: { type: String, required: true },
    moderatorId: { type: String, required: true },
    moderatorTag: { type: String, required: true },
    action: {
      type: String,
      required: true,
      enum: [
        "ban",
        "unban",
        "kick",
        "softban",
        "mute",
        "unmute",
        "timeout",
        "warn",
        "unwarn",
        "jail",
        "unjail",
        "purge",
        "lock",
        "unlock",
      ],
    },
    reason: { type: String, default: "No reason provided." },
    durationSeconds: { type: Number, default: null },
    expiresAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "expired", "reverted", "completed"],
      default: "completed",
    },
    source: {
      type: String,
      enum: ["command", "automod", "antinuke", "antiraid", "antibetray", "limits"],
      default: "command",
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

ModerationCaseSchema.index({ guildId: 1, caseId: 1 }, { unique: true });
ModerationCaseSchema.index({ guildId: 1, targetId: 1 });
ModerationCaseSchema.index({ guildId: 1, createdAt: -1 });

export const ModerationCaseModel =
  mongoose.models.ModerationCase ??
  mongoose.model<ModerationCase>("ModerationCase", ModerationCaseSchema);
