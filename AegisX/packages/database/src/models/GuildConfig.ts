import mongoose, { Schema, Document } from "mongoose";

export interface WhitelistPermissions {
  ban?: boolean;
  kick?: boolean;
  prune?: boolean;
  botadd?: boolean;
  serverup?: boolean;
  memup?: boolean;
  chcr?: boolean;
  chdl?: boolean;
  chup?: boolean;
  rlcr?: boolean;
  rlup?: boolean;
  rldl?: boolean;
  meneve?: boolean;
  mngweb?: boolean;
  mngstemo?: boolean;
}

export interface AntiNukeConfig {
  enabled: boolean;
  action: "ban" | "kick" | "strip_roles";
  threshold: number;
  windowSeconds: number;
  recoveryEnabled: boolean;
  logChannelId: string | null;
}

export interface SecurityConfig {
  antiNuke: AntiNukeConfig;
  whitelistedUsers: Record<string, WhitelistPermissions>;
  extraOwners: string[];
}

export interface AutomodConfig {
  enabled: boolean;
  punishments: Record<string, string>;
  ignoredRoles: string[];
  ignoredChannels: string[];
  ignoredUsers: string[];
  loggingChannel: string | null;
}

export interface LoggingConfig {
  logEnabled: Record<string, boolean>;
  logChannels: Record<string, string>;
  ignoreChannels: string[];
  ignoreRoles: string[];
  ignoreUsers: string[];
  autoDeleteDuration: number | null;
}

export interface AutoRoleConfig {
  bots: string[];
  humans: string[];
}

export interface VerificationConfig {
  enabled: boolean;
  verificationChannelId: string | null;
  verifiedRoleId: string | null;
  logChannelId: string | null;
  verificationMethod: string;
}

export interface VanityRoleSetup {
  vanity: string;
  roleId: string;
  logChannelId?: string | null;
}


export interface WelcomeConfig {
  welcomeType: string | null;
  welcomeMessage: string | null;
  channelId: string | null;
  embedData: Record<string, unknown> | null;
  autoDeleteDuration: number | null;
}

export interface TicketCategory {
  name: string;
  emoji: string | null;
  staffRoles: string[];
  buttonStyle?: number;
  discordCategoryId?: string | null;
}

export interface TicketConfig {
  panelChannelId: string | null;
  panelMessageId: string | null;
  loggingChannelId: string | null;
  closedCategoryId: string | null;
  panelType: string;
  embedTitle: string | null;
  embedDescription: string | null;
  embedColor: number | null;
  embedImageUrl: string | null;
  embedThumbnailUrl: string | null;
  categories: TicketCategory[];
  staffRoles: string[];
}

export interface LevelingConfig {
  enabled: boolean;
  xpPerMessage: number;
  cooldownSeconds: number;
  levelUpChannelId: string | null;
  embedColor: string;
  thumbnailEnabled: boolean;
  levelImage: string | null;
}

export interface GuildConfig {
  guildId: string;
  prefix: string;
  security: SecurityConfig;
  automod: AutomodConfig;
  logging: LoggingConfig;
  autorole: AutoRoleConfig;
  verification: VerificationConfig;
  vanityRoles: VanityRoleSetup[];
  welcome: WelcomeConfig;
  tickets: TicketConfig;
  leveling: LevelingConfig;
}

export type GuildConfigDocument = GuildConfig & Document;

const WhitelistPermissionsSchema = new Schema<WhitelistPermissions>(
  {
    ban: { type: Boolean, default: false },
    kick: { type: Boolean, default: false },
    prune: { type: Boolean, default: false },
    botadd: { type: Boolean, default: false },
    serverup: { type: Boolean, default: false },
    memup: { type: Boolean, default: false },
    chcr: { type: Boolean, default: false },
    chdl: { type: Boolean, default: false },
    chup: { type: Boolean, default: false },
    rlcr: { type: Boolean, default: false },
    rlup: { type: Boolean, default: false },
    rldl: { type: Boolean, default: false },
    meneve: { type: Boolean, default: false },
    mngweb: { type: Boolean, default: false },
    mngstemo: { type: Boolean, default: false },
  },
  { _id: false },
);

const AntiNukeSchema = new Schema<AntiNukeConfig>(
  {
    enabled: { type: Boolean, default: false },
    action: {
      type: String,
      enum: ["ban", "kick", "strip_roles"],
      default: "ban",
    },
    threshold: { type: Number, default: 1, min: 1 },
    windowSeconds: { type: Number, default: 10, min: 1 },
    recoveryEnabled: { type: Boolean, default: true },
    logChannelId: { type: String, default: null },
  },
  { _id: false },
);

const SecuritySchema = new Schema<SecurityConfig>(
  {
    antiNuke: { type: AntiNukeSchema, default: () => ({}) },
    whitelistedUsers: {
      type: Map,
      of: WhitelistPermissionsSchema,
      default: () => new Map(),
    },
    extraOwners: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const AutomodSchema = new Schema<AutomodConfig>(
  {
    enabled: { type: Boolean, default: false },
    punishments: {
      type: Map,
      of: String,
      default: () => ({
        "Anti link": "Mute",
        "Anti invites": "Mute",
        "Anti spam": "Mute",
        "Anti caps": "Mute",
        "Anti mass mention": "Mute",
        "Anti emoji spam": "Mute",
        "Anti NSFW link": "Block",
      }),
    },
    ignoredRoles: { type: [String], default: [] },
    ignoredChannels: { type: [String], default: [] },
    ignoredUsers: { type: [String], default: [] },
    loggingChannel: { type: String, default: null },
  },
  { _id: false },
);

const LoggingSchema = new Schema<LoggingConfig>(
  {
    logEnabled: { type: Map, of: Boolean, default: () => new Map() },
    logChannels: { type: Map, of: String, default: () => new Map() },
    ignoreChannels: { type: [String], default: [] },
    ignoreRoles: { type: [String], default: [] },
    ignoreUsers: { type: [String], default: [] },
    autoDeleteDuration: { type: Number, default: null },
  },
  { _id: false },
);

const AutoRoleSchema = new Schema<AutoRoleConfig>(
  {
    bots: { type: [String], default: [] },
    humans: { type: [String], default: [] },
  },
  { _id: false },
);

const VerificationSchema = new Schema<VerificationConfig>(
  {
    enabled: { type: Boolean, default: false },
    verificationChannelId: { type: String, default: null },
    verifiedRoleId: { type: String, default: null },
    logChannelId: { type: String, default: null },
    verificationMethod: { type: String, default: "button" },
  },
  { _id: false },
);

const VanityRoleSchema = new Schema<VanityRoleSetup>(
  {
    vanity: { type: String, required: true },
    roleId: { type: String, required: true },
    logChannelId: { type: String, default: null },
  },
  { _id: false },
);

const WelcomeSchema = new Schema<WelcomeConfig>(
  {
    welcomeType: { type: String, default: "simple" },
    welcomeMessage: { type: String, default: null },
    channelId: { type: String, default: null },
    embedData: { type: Schema.Types.Mixed, default: null },
    autoDeleteDuration: { type: Number, default: null },
  },
  { _id: false },
);

const TicketCategorySchema = new Schema<TicketCategory>(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: null },
    staffRoles: { type: [String], default: [] },
    buttonStyle: { type: Number, default: 1 },
    discordCategoryId: { type: String, default: null },
  },
  { _id: false },
);

const TicketSchema = new Schema<TicketConfig>(
  {
    panelChannelId: { type: String, default: null },
    panelMessageId: { type: String, default: null },
    loggingChannelId: { type: String, default: null },
    closedCategoryId: { type: String, default: null },
    panelType: { type: String, default: "button" },
    embedTitle: { type: String, default: "Support Department" },
    embedDescription: { type: String, default: "Open a ticket below to talk to our staff." },
    embedColor: { type: Number, default: 0x5865f2 },
    embedImageUrl: { type: String, default: null },
    embedThumbnailUrl: { type: String, default: null },
    categories: { type: [TicketCategorySchema], default: [] },
    staffRoles: { type: [String], default: [] },
  },
  { _id: false },
);

const LevelingSchema = new Schema<LevelingConfig>(
  {
    enabled: { type: Boolean, default: false },
    xpPerMessage: { type: Number, default: 20 },
    cooldownSeconds: { type: Number, default: 60 },
    levelUpChannelId: { type: String, default: null },
    embedColor: { type: String, default: "#5865F2" },
    thumbnailEnabled: { type: Boolean, default: true },
    levelImage: { type: String, default: null },
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
    prefix: {
      type: String,
      default: ">",
    },
    security: {
      type: SecuritySchema,
      default: () => ({}),
    },
    automod: {
      type: AutomodSchema,
      default: () => ({}),
    },
    logging: {
      type: LoggingSchema,
      default: () => ({}),
    },
    autorole: {
      type: AutoRoleSchema,
      default: () => ({}),
    },
    verification: {
      type: VerificationSchema,
      default: () => ({}),
    },
    vanityRoles: {
      type: [VanityRoleSchema],
      default: [],
    },
    welcome: {
      type: WelcomeSchema,
      default: () => ({}),
    },
    tickets: {
      type: TicketSchema,
      default: () => ({}),
    },
    leveling: {
      type: LevelingSchema,
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