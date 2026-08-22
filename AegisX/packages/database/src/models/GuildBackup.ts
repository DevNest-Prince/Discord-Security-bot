import mongoose, { Schema, Document } from "mongoose";

export interface BackupRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  mentionable: boolean;
}

export interface BackupChannel {
  name: string;
  type: number;
  topic?: string | null;
  bitrate?: number;
  userLimit?: number;
  rateLimitPerUser?: number;
  parent?: string | null;
  position: number;
  permissionOverwrites: Array<{
    id: string;
    type: number;
    allow: string;
    deny: string;
  }>;
}

export interface BackupCategory {
  name: string;
  position: number;
  permissionOverwrites: Array<{
    id: string;
    type: number;
    allow: string;
    deny: string;
  }>;
}

export interface GuildBackup {
  backupId: string;
  guildId: string;
  creatorId: string;
  name: string;
  iconUrl?: string | null;
  roles: BackupRole[];
  categories: BackupCategory[];
  channels: BackupChannel[];
  createdAt: Date;
}

export type GuildBackupDocument = GuildBackup & Document;

const GuildBackupSchema = new Schema<GuildBackup>(
  {
    backupId: { type: String, required: true, unique: true, index: true },
    guildId: { type: String, required: true, index: true },
    creatorId: { type: String, required: true },
    name: { type: String, required: true },
    roles: { type: Schema.Types.Mixed, default: [] },
    categories: { type: Schema.Types.Mixed, default: [] },
    channels: { type: Schema.Types.Mixed, default: [] },

    createdAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const GuildBackupModel =
  mongoose.models.GuildBackup ??
  mongoose.model<GuildBackup>("GuildBackup", GuildBackupSchema);
