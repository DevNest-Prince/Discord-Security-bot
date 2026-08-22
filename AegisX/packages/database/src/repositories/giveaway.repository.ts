import { GiveawayRecordModel, type GiveawayRecord } from "../models/GiveawayRecord.js";

export async function createGiveaway(data: Partial<GiveawayRecord>): Promise<GiveawayRecord> {
  const record = new GiveawayRecordModel(data);
  return record.save();
}

export async function getGiveawayByMessageId(messageId: string): Promise<GiveawayRecord | null> {
  return GiveawayRecordModel.findOne({ messageId }).exec();
}

export async function getActiveGiveaways(guildId?: string): Promise<GiveawayRecord[]> {
  const query: any = { ended: false };
  if (guildId) query.guildId = guildId;
  return GiveawayRecordModel.find(query).exec();
}

export async function getDueGiveaways(): Promise<GiveawayRecord[]> {
  return GiveawayRecordModel.find({
    ended: false,
    endsAt: { $lte: new Date() },
  }).exec();
}

export async function endGiveaway(
  messageId: string,
  winners: string[],
): Promise<GiveawayRecord | null> {
  return GiveawayRecordModel.findOneAndUpdate(
    { messageId },
    { $set: { ended: true, winners } },
    { new: true },
  ).exec();
}

export async function addParticipant(
  messageId: string,
  userId: string,
): Promise<GiveawayRecord | null> {
  return GiveawayRecordModel.findOneAndUpdate(
    { messageId, ended: false },
    { $addToSet: { participants: userId } },
    { new: true },
  ).exec();
}

export async function removeParticipant(
  messageId: string,
  userId: string,
): Promise<GiveawayRecord | null> {
  return GiveawayRecordModel.findOneAndUpdate(
    { messageId, ended: false },
    { $pull: { participants: userId } },
    { new: true },
  ).exec();
}

export async function deleteGiveaway(messageId: string): Promise<boolean> {
  const res = await GiveawayRecordModel.deleteOne({ messageId }).exec();
  return (res.deletedCount ?? 0) > 0;
}
