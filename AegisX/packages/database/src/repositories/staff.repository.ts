import { StaffPermissionProfileModel, type StaffPermissionProfile } from "../models/StaffPermissionProfile.js";

export async function getStaffProfiles(guildId: string): Promise<StaffPermissionProfile[]> {
  return StaffPermissionProfileModel.find({ guildId })
    .sort({ priority: -1 })
    .lean<StaffPermissionProfile[]>()
    .exec();
}

export async function getStaffProfileByRole(
  guildId: string,
  roleId: string,
): Promise<StaffPermissionProfile | null> {
  return StaffPermissionProfileModel.findOne({ guildId, roleId })
    .lean<StaffPermissionProfile | null>()
    .exec();
}

export async function upsertStaffProfile(
  guildId: string,
  roleId: string,
  data: Partial<StaffPermissionProfile>,
): Promise<StaffPermissionProfile> {
  const updated = await StaffPermissionProfileModel.findOneAndUpdate(
    { guildId, roleId },
    { $set: { ...data, guildId, roleId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<StaffPermissionProfile>()
    .exec();

  return updated!;
}

export async function deleteStaffProfile(guildId: string, roleId: string): Promise<boolean> {
  const res = await StaffPermissionProfileModel.deleteOne({ guildId, roleId }).exec();
  return res.deletedCount > 0;
}

export async function getHighestStaffPriorityForUser(
  guildId: string,
  userRoleIds: string[],
): Promise<StaffPermissionProfile | null> {
  const profiles = await StaffPermissionProfileModel.find({
    guildId,
    roleId: { $in: userRoleIds },
  })
    .sort({ priority: -1 })
    .lean<StaffPermissionProfile[]>()
    .exec();

  return profiles[0] || null;
}
