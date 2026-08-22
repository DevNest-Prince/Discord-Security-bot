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

