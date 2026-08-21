import mongoose, {
  Schema,
  type InferSchemaType,
} from "mongoose";


export interface AntiNukeConfig {
  enabled: boolean;
  action: "ban" | "kick" | "strip_roles";
  threshold: number;
  windowSeconds: number;
}

export interface SecurityConfig {
  antiNuke: AntiNukeConfig;
}

export interface GuildConfig {
  guildId: string;
  security: SecurityConfig;
}

const AntiNukeSchema = new Schema<AntiNukeConfig>(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    action: {
      type: String,
      enum: ["ban", "kick", "strip_roles"],
      default: "strip_roles",
    },

    threshold: {
      type: Number,
      default: 3,
      min: 1,
    },

    windowSeconds: {
      type: Number,
      default: 10,
      min: 1,
    },
  },
  { _id: false },
);

const SecuritySchema = new Schema<SecurityConfig>(
  {
    antiNuke: {
      type: AntiNukeSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

const GuildConfigSchema = new Schema<GuildConfig>(
  {
    guildId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    security: {
      type: SecuritySchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const GuildConfigModel =
  mongoose.models.GuildConfig ??
  mongoose.model<GuildConfig>("GuildConfig", GuildConfigSchema);