import mongoose, { Schema, Document } from "mongoose";

export interface StaffPermissionProfile {
  guildId: string;
  roleId: string;
  name: string;
  priority: number; // Higher number = higher authority (e.g. 100 = Super Admin, 50 = Moderator)
  allowedModules: string[]; // e.g. ["moderation", "automod", "security", "jail", "tickets", "logging"]
  allowedCommands: string[]; // e.g. ["ban", "kick", "mute", "timeout", "warn", "jail", "purge", "lock"]
  allowedActions: string[];
  maxMuteDurationSeconds?: number; // e.g. max 86400 (24h) for junior mods
  canModerateLowerStaff: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StaffPermissionProfileDocument = StaffPermissionProfile & Document;

const StaffPermissionProfileSchema = new Schema<StaffPermissionProfile>(
  {
    guildId: { type: String, required: true, index: true },
    roleId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    priority: { type: Number, default: 10 },
    allowedModules: { type: [String], default: [] },
    allowedCommands: { type: [String], default: [] },
    allowedActions: { type: [String], default: [] },
    maxMuteDurationSeconds: { type: Number, default: 0 }, // 0 = unlimited
    canModerateLowerStaff: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

StaffPermissionProfileSchema.index({ guildId: 1, roleId: 1 }, { unique: true });
StaffPermissionProfileSchema.index({ guildId: 1, priority: -1 });

export const StaffPermissionProfileModel =
  mongoose.models.StaffPermissionProfile ??
  mongoose.model<StaffPermissionProfile>("StaffPermissionProfile", StaffPermissionProfileSchema);
