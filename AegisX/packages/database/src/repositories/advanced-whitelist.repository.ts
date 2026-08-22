import {
  AdvancedWhitelistModel,
  type AdvancedWhitelist,
} from "../models/AdvancedWhitelist.js";

export async function addAdvancedWhitelist(
  data: Omit<AdvancedWhitelist, "createdAt">,
): Promise<AdvancedWhitelist> {
  const updated = await AdvancedWhitelistModel.findOneAndUpdate(
    { guildId: data.guildId, targetId: data.targetId, module: data.module },
    { $set: { ...data, createdAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<AdvancedWhitelist>()
    .exec();

  return updated!;
}

export async function removeAdvancedWhitelist(
  guildId: string,
  targetId: string,
  module: string,
): Promise<boolean> {
  const query: any = { guildId, targetId };
  if (module !== "all") {
    query.module = { $in: [module, "all"] };
  }
  const res = await AdvancedWhitelistModel.deleteMany(query).exec();
  return res.deletedCount > 0;
}

export async function isTargetWhitelisted(
  guildId: string,
  targetIds: string[],
  module: string,
): Promise<boolean> {
  const now = new Date();
  const found = await AdvancedWhitelistModel.findOne({
    guildId,
    targetId: { $in: targetIds },
    module: { $in: ["all", module] },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .lean<AdvancedWhitelist | null>()
    .exec();

  return !!found;
}

export async function listGuildWhitelists(guildId: string): Promise<AdvancedWhitelist[]> {
  const now = new Date();
  return AdvancedWhitelistModel.find({
    guildId,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ createdAt: -1 })
    .lean<AdvancedWhitelist[]>()
    .exec();
}
