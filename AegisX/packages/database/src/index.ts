export {
  connectDatabase,
  disconnectDatabase,
} from "./client.js";

export {
  findGuild,
  createGuild,
  findOrCreateGuild,
} from "./repositories/guild.repository.js";

export {
  getGuildConfig,
} from "./services/guild-config.service.js";

export {
  GuildConfigModel,
  type GuildConfig,
  type GuildConfigDocument,
  type WhitelistPermissions,
  type AntiNukeConfig,
  type SecurityConfig,
  type AutomodConfig,
  type EmergencyConfig,
  type AntiBetrayConfig,
  type LimitsConfig,
  type ActionLimitSetting,
  type ChannelOverwriteSnapshot,
  type ChannelSnapshotData,
  type LoggingConfig,
  type AutoRoleConfig,
  type VerificationConfig,
  type VanityRoleSetup,
  type WelcomeConfig,
  type GoodbyeConfig,
  type JailConfig,
  type RaidConfig,
  type WarnConfig,
  type WarnEscalationRule,
  type TicketConfig,
  type TicketCategory,
  type LevelingConfig,
  type J2CConfig,
  type InVcRoleConfig,
  type AutoReactRule,
  type JoinDmConfig,
  type CustomRoleConfig,
} from "./models/GuildConfig.js";

export {
  StaffPermissionProfileModel,
  type StaffPermissionProfile,
  type StaffPermissionProfileDocument,
} from "./models/StaffPermissionProfile.js";

export {
  ModerationCaseModel,
  type ModerationCase,
  type ModerationCaseDocument,
} from "./models/ModerationCase.js";

export {
  WarnRecordModel,
  type WarnRecord,
  type WarnRecordDocument,
} from "./models/WarnRecord.js";

export {
  JailSessionModel,
  type JailSession,
  type JailSessionDocument,
} from "./models/JailSession.js";

export {
  AdvancedWhitelistModel,
  type AdvancedWhitelist,
  type AdvancedWhitelistDocument,
} from "./models/AdvancedWhitelist.js";

export {
  ActivityLeaderboardModel,
  type ActivityLeaderboard,
  type ActivityLeaderboardDocument,
} from "./models/ActivityLeaderboard.js";

export {
  VoiceSessionModel,
  type VoiceSession,
  type VoiceSessionDocument,
} from "./models/VoiceSession.js";

export {
  AuditConfigHistoryModel,
  type AuditConfigHistory,
  type AuditConfigHistoryDocument,
} from "./models/AuditConfigHistory.js";

export {
  UserLevelModel,
  type UserLevel,
  type UserLevelDocument,
} from "./models/UserLevel.js";

export {
  GuildBackupModel,
  type GuildBackup,
  type GuildBackupDocument,
  type BackupRole,
  type BackupCategory,
  type BackupChannel,
} from "./models/GuildBackup.js";

export {
  TicketRecordModel,
  type TicketRecord,
  type TicketRecordDocument,
} from "./models/TicketRecord.js";

export {
  findGuildConfig,
  createGuildConfig,
  updateGuildConfig,
  updateGuildPrefix,

  updateAntiNukeConfig,
  setWhitelistedUser,
  removeWhitelistedUser,
  resetWhitelistedUsers,
  setExtraOwner,
  removeExtraOwner,
  resetExtraOwners,
  updateAutomodConfig,
  updateEmergencyConfig,
  updateAntiBetrayConfig,
  updateLimitsConfig,
  updateLoggingConfig,
  updateAutoRoleConfig,
  updateVerificationConfig,
  setVanityRole,
  removeVanityRole,
  updateWelcomeConfig,
  deleteWelcomeConfig,
  updateTicketConfig,
  updateLevelingConfig,
  updateJ2CConfig,
  updateInVcRoleConfig,
  updateAutoReactRules,
  updateJoinDmConfig,
  updateCustomRolesConfig,
} from "./repositories/guild-config.repository.js";

export {
  getStaffProfiles,
  getStaffProfileByRole,
  upsertStaffProfile,
  deleteStaffProfile,
  getHighestStaffPriorityForUser,
} from "./repositories/staff.repository.js";

export {
  getNextCaseId,
  createModerationCase,
  getModerationCase,
  getUserModerationHistory,
  updateCaseReason,
  getGuildCaseCount,
} from "./repositories/moderation-case.repository.js";

export {
  addWarning,
  getActiveWarnings,
  getActiveWarningPoints,
  clearUserWarnings,
  removeWarningByCaseId,
} from "./repositories/warn.repository.js";

export {
  createJailSession,
  getActiveJailSession,
  getExpiredJailSessions,
  closeJailSession,
  listActiveJails,
  getUserJailHistory,
} from "./repositories/jail.repository.js";

export {
  addAdvancedWhitelist,
  removeAdvancedWhitelist,
  isTargetWhitelisted,
  listGuildWhitelists,
} from "./repositories/advanced-whitelist.repository.js";

export {
  recordMessageActivity,
  recordVoiceActivity,
  getLeaderboard,
  getUserActivity,
  resetLeaderboardInterval,
} from "./repositories/activity.repository.js";

export {
  logConfigChange,
  getGuildConfigAuditHistory,
} from "./repositories/audit-config.repository.js";

export {
  getUserLevel,
  addMessageXp,
  getGuildLeaderboard,
  getUserRank,
} from "./repositories/leveling.repository.js";

export {
  createBackup,
  getBackup,
  listGuildBackups,
  deleteBackup,
} from "./repositories/backup.repository.js";

export {
  createTicketRecord,
  getTicketRecordByChannel,
  closeTicketRecord,
  claimTicketRecord,
  getUserOpenTicket,
} from "./repositories/ticket.repository.js";

export {
  getGuildConfig as getSecurityGuildConfig,
} from "./services/guild-config.service.js";