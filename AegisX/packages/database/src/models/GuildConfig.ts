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

export interface ChannelOverwriteSnapshot {
  id: string;
  type: number;
  allow: string;
  deny: string;
}

export interface ChannelSnapshotData {
  channelId: string;
  overwrites: ChannelOverwriteSnapshot[];
}

export interface EmergencyConfig {
  enabled: boolean;
  autoEmergency: boolean;
  lockedChannels: string[];
  snapshot: ChannelSnapshotData[];
}

export interface AntiBetrayConfig {
  enabled: boolean;
  maxSuspiciousActions: number;
  action: "demote" | "ban" | "strip_roles";
  logChannelId: string | null;
}

export interface ActionLimitSetting {
  count: number;
  windowSeconds: number;
  action: "ban" | "kick" | "strip_roles" | "timeout";
}

export interface LimitsConfig {
  enabled: boolean;
  limits: Record<string, ActionLimitSetting>;
}

export interface J2CConfig {

  enabled: boolean;
  hubChannelId: string | null;
  categoryId: string | null;
  defaultName: string;
  defaultLimit: number;
}

export interface InVcRoleConfig {
  enabled: boolean;
  roleId: string | null;
}

export interface AutoReactRule {
  channelId: string;
  emojis: string[];
}

export interface JoinDmConfig {
  enabled: boolean;
  message: string | null;
}

export interface CustomRoleConfig {
  name: string;
  roleId: string;
  requiredRoleId?: string | null;
}

export interface JailConfig {
  enabled: boolean;
  jailRoleId: string | null;
  jailCategoryId: string | null;
  jailChannelId: string | null;
  logChannelId: string | null;
  autoRoleRestore: boolean;
  rejoinProtection: boolean;
}

export interface RaidConfig {
  enabled: boolean;
  joinThreshold: number; // e.g. 5 joins
  windowSeconds: number; // e.g. in 10 seconds
  minAccountAgeDays: number; // e.g. accounts newer than 3 days
  action: "lockdown" | "kick" | "ban" | "jail" | "verification";
  logChannelId: string | null;
}

export interface GoodbyeConfig {
  enabled: boolean;
  channelId: string | null;
  message: string | null;
  embedData: Record<string, unknown> | null;
  autoDeleteDuration: number | null;
}

export interface WarnEscalationRule {
  warnCount: number;
  action: "timeout" | "mute" | "jail" | "kick" | "ban";
  durationSeconds?: number;
}

export interface WarnConfig {
  enabled: boolean;
  maxPoints: number;
  expirationDays: number;
  escalationRules: WarnEscalationRule[];
}

export interface GuildConfig {
  guildId: string;
  prefix: string;
  security: SecurityConfig;
  automod: AutomodConfig;
  emergency: EmergencyConfig;
  antiBetray: AntiBetrayConfig;
  limits: LimitsConfig;
  logging: LoggingConfig;
  autorole: AutoRoleConfig;
  verification: VerificationConfig;
  vanityRoles: VanityRoleSetup[];
  welcome: WelcomeConfig;
  goodbye: GoodbyeConfig;
  jail: JailConfig;
  raid: RaidConfig;
  warns: WarnConfig;
  tickets: TicketConfig;
  leveling: LevelingConfig;
  j2c: J2CConfig;
  inVcRole: InVcRoleConfig;
  autoReact: AutoReactRule[];
  joinDm: JoinDmConfig;
  customRoles: CustomRoleConfig[];
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

const ChannelOverwriteSnapshotSchema = new Schema<ChannelOverwriteSnapshot>(
  {
    id: { type: String, required: true },
    type: { type: Number, required: true },
    allow: { type: String, required: true },
    deny: { type: String, required: true },
  },
  { _id: false },
);

const ChannelSnapshotDataSchema = new Schema<ChannelSnapshotData>(
  {
    channelId: { type: String, required: true },
    overwrites: { type: [ChannelOverwriteSnapshotSchema], default: [] },
  },
  { _id: false },
);

const EmergencySchema = new Schema<EmergencyConfig>(
  {
    enabled: { type: Boolean, default: false },
    autoEmergency: { type: Boolean, default: true },
    lockedChannels: { type: [String], default: [] },
    snapshot: { type: [ChannelSnapshotDataSchema], default: [] },
  },
  { _id: false },
);

const AntiBetraySchema = new Schema<AntiBetrayConfig>(
  {
    enabled: { type: Boolean, default: false },
    maxSuspiciousActions: { type: Number, default: 3 },
    action: { type: String, enum: ["demote", "ban", "strip_roles"], default: "demote" },
    logChannelId: { type: String, default: null },
  },
  { _id: false },
);

const ActionLimitSettingSchema = new Schema<ActionLimitSetting>(
  {
    count: { type: Number, default: 3 },
    windowSeconds: { type: Number, default: 60 },
    action: { type: String, enum: ["ban", "kick", "strip_roles", "timeout"], default: "ban" },
  },
  { _id: false },
);

const LimitsSchema = new Schema<LimitsConfig>(
  {
    enabled: { type: Boolean, default: false },
    limits: { type: Map, of: ActionLimitSettingSchema, default: () => new Map() },
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

const J2CSchema = new Schema<J2CConfig>(
  {
    enabled: { type: Boolean, default: false },
    hubChannelId: { type: String, default: null },
    categoryId: { type: String, default: null },
    defaultName: { type: String, default: "🔊 {user}'s Room" },
    defaultLimit: { type: Number, default: 0 },
  },
  { _id: false },
);

const InVcRoleSchema = new Schema<InVcRoleConfig>(
  {
    enabled: { type: Boolean, default: false },
    roleId: { type: String, default: null },
  },
  { _id: false },
);

const AutoReactSchema = new Schema<AutoReactRule>(
  {
    channelId: { type: String, required: true },
    emojis: { type: [String], default: [] },
  },
  { _id: false },
);

const JoinDmSchema = new Schema<JoinDmConfig>(
  {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: null },
  },
  { _id: false },
);

const CustomRoleSchema = new Schema<CustomRoleConfig>(
  {
    name: { type: String, required: true },
    roleId: { type: String, required: true },
    requiredRoleId: { type: String, default: null },
  },
  { _id: false },
);

const JailSchema = new Schema<JailConfig>(
  {
    enabled: { type: Boolean, default: false },
    jailRoleId: { type: String, default: null },
    jailCategoryId: { type: String, default: null },
    jailChannelId: { type: String, default: null },
    logChannelId: { type: String, default: null },
    autoRoleRestore: { type: Boolean, default: true },
    rejoinProtection: { type: Boolean, default: true },
  },
  { _id: false },
);

const RaidSchema = new Schema<RaidConfig>(
  {
    enabled: { type: Boolean, default: false },
    joinThreshold: { type: Number, default: 5 },
    windowSeconds: { type: Number, default: 10 },
    minAccountAgeDays: { type: Number, default: 3 },
    action: {
      type: String,
      enum: ["lockdown", "kick", "ban", "jail", "verification"],
      default: "verification",
    },
    logChannelId: { type: String, default: null },
  },
  { _id: false },
);

const GoodbyeSchema = new Schema<GoodbyeConfig>(
  {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: null },
    embedData: { type: Schema.Types.Mixed, default: null },
    autoDeleteDuration: { type: Number, default: null },
  },
  { _id: false },
);

const WarnEscalationRuleSchema = new Schema<WarnEscalationRule>(
  {
    warnCount: { type: Number, required: true },
    action: {
      type: String,
      enum: ["timeout", "mute", "jail", "kick", "ban"],
      required: true,
    },
    durationSeconds: { type: Number, default: 3600 },
  },
  { _id: false },
);

const WarnsSchema = new Schema<WarnConfig>(
  {
    enabled: { type: Boolean, default: true },
    maxPoints: { type: Number, default: 5 },
    expirationDays: { type: Number, default: 30 },
    escalationRules: {
      type: [WarnEscalationRuleSchema],
      default: [
        { warnCount: 2, action: "timeout", durationSeconds: 3600 },
        { warnCount: 3, action: "jail", durationSeconds: 86400 },
        { warnCount: 4, action: "ban" },
      ],
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
    emergency: {
      type: EmergencySchema,
      default: () => ({}),
    },
    antiBetray: {
      type: AntiBetraySchema,
      default: () => ({}),
    },
    limits: {
      type: LimitsSchema,
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
    goodbye: {
      type: GoodbyeSchema,
      default: () => ({}),
    },
    jail: {
      type: JailSchema,
      default: () => ({}),
    },
    raid: {
      type: RaidSchema,
      default: () => ({}),
    },
    warns: {
      type: WarnsSchema,
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
    j2c: {
      type: J2CSchema,
      default: () => ({}),
    },
    inVcRole: {
      type: InVcRoleSchema,
      default: () => ({}),
    },
    autoReact: {
      type: [AutoReactSchema],
      default: [],
    },
    joinDm: {
      type: JoinDmSchema,
      default: () => ({}),
    },
    customRoles: {
      type: [CustomRoleSchema],
      default: [],
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