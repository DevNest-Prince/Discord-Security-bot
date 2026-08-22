import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface AutoResponderRule extends Document {
  guildId: string;
  trigger: string;
  response: string;
  matchType: "exact" | "contains" | "startswith" | "endswith" | "regex";
  cooldownSeconds: number;
  ignoredChannels: string[];
  ignoredRoles: string[];
  replyInDm: boolean;
  deleteTrigger: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AutoResponderRuleSchema = new Schema<AutoResponderRule>(
  {
    guildId: { type: String, required: true, index: true },
    trigger: { type: String, required: true },
    response: { type: String, required: true },
    matchType: {
      type: String,
      enum: ["exact", "contains", "startswith", "endswith", "regex"],
      default: "exact",
    },
    cooldownSeconds: { type: Number, default: 3 },
    ignoredChannels: { type: [String], default: [] },
    ignoredRoles: { type: [String], default: [] },
    replyInDm: { type: Boolean, default: false },
    deleteTrigger: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

AutoResponderRuleSchema.index({ guildId: 1, trigger: 1 }, { unique: true });

export const AutoResponderRuleModel: Model<AutoResponderRule> =
  mongoose.models.AutoResponderRule ||
  mongoose.model<AutoResponderRule>("AutoResponderRule", AutoResponderRuleSchema);
