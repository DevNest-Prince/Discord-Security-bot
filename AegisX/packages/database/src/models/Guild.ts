import { Schema, model, type InferSchemaType } from "mongoose";

const guildSchema = new Schema(
  {
    guildId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    security: {
      antiNuke: {
        enabled: { type: Boolean, default: true },
      },

      antiRaid: {
        enabled: { type: Boolean, default: true },
      },

      antiBot: {
        enabled: { type: Boolean, default: false },
      },

      antiWebhook: {
        enabled: { type: Boolean, default: true },
      },

      antiMassMention: {
        enabled: { type: Boolean, default: true },
      },
    },

    moderation: {
      automod: {
        enabled: { type: Boolean, default: true },
      },

      spam: {
        enabled: { type: Boolean, default: true },
      },

      badWords: {
        enabled: { type: Boolean, default: false },
      },
    },

    logging: {
      securityChannelId: {
        type: String,
        default: null,
      },

      moderationChannelId: {
        type: String,
        default: null,
      },

      memberChannelId: {
        type: String,
        default: null,
      },
    },

    settings: {
      language: {
        type: String,
        default: "en",
      },
    },
  },
  {
    timestamps: true,
  },
);

export type Guild = InferSchemaType<typeof guildSchema>;

export const GuildModel = model("Guild", guildSchema);