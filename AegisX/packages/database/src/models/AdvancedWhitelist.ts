import mongoose, { Schema, Document } from "mongoose";

export interface AdvancedWhitelist {
  guildId: string;
  targetId: string;
  targetType: "user" | "role" | "channel" | "category" | "bot";
  module: "all" | "spam" | "links" | "invites" | "mentions" | "automod" | "antinuke" | "antiraid" | "antibetray" | "limits" | "roles" | "channels" | "webhooks";
  reason: string;
  createdBy: string;
  expiresAt?: Date | null;
  createdAt: Date;
}

export type AdvancedWhitelistDocument = AdvancedWhitelist & Document;

const AdvancedWhitelistSchema = new Schema<AdvancedWhitelist>(
  {
    guildId: { type: String, required: true, index: true },
    targetId: { type: String, required: true, index: true },
    targetType: {
      type: String,
      required: true,
      enum: ["user", "role", "channel", "category", "bot"],
    },
    module: {
      type: String,
      required: true,
      enum: [
        "all",
        "spam",
        "links",
        "invites",
        "mentions",
        "automod",
        "antinuke",
        "antiraid",
        "antibetray",
        "limits",
        "roles",
        "channels",
        "webhooks",
      ],
    },
    reason: { type: String, default: "No reason provided." },
    createdBy: { type: String, required: true },
    expiresAt: { type: Date, default: null },
    createdAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

AdvancedWhitelistSchema.index({ guildId: 1, targetId: 1, module: 1 }, { unique: true });

export const AdvancedWhitelistModel =
  mongoose.models.AdvancedWhitelist ??
  mongoose.model<AdvancedWhitelist>("AdvancedWhitelist", AdvancedWhitelistSchema);
