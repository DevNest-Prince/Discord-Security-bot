import { TicketRecordModel, type TicketRecord } from "../models/TicketRecord.js";

export async function createTicketRecord(
  data: Omit<TicketRecord, "createdAt">,
): Promise<TicketRecord> {
  const doc = await TicketRecordModel.create(data);
  return doc.toObject();
}

export async function getTicketRecordByChannel(
  channelId: string,
): Promise<TicketRecord | null> {
  return TicketRecordModel.findOne({ channelId }).lean<TicketRecord>().exec();
}

export async function closeTicketRecord(
  channelId: string,
  closedBy: string,
  transcriptUrl?: string,
): Promise<TicketRecord | null> {
  return TicketRecordModel.findOneAndUpdate(
    { channelId },
    {
      $set: {
        status: "closed",
        closedBy,
        closedAt: new Date(),
        transcriptUrl: transcriptUrl || null,
      },
    },
    { new: true },
  )
    .lean<TicketRecord>()
    .exec();
}

export async function claimTicketRecord(
  channelId: string,
  claimedBy: string,
): Promise<TicketRecord | null> {
  return TicketRecordModel.findOneAndUpdate(
    { channelId },
    {
      $set: {
        status: "claimed",
        claimedBy,
      },
    },
    { new: true },
  )
    .lean<TicketRecord>()
    .exec();
}

export async function getUserOpenTicket(
  guildId: string,
  userId: string,
): Promise<TicketRecord | null> {
  return TicketRecordModel.findOne({
    guildId,
    userId,
    status: { $in: ["open", "claimed"] },
  })
    .lean<TicketRecord>()
    .exec();
}
