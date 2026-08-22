import mongoose, { Schema, Document } from "mongoose";

export interface TicketRecord {
  guildId: string;
  channelId: string;
  userId: string;
  category: string;
  status: "open" | "closed" | "claimed";
  claimedBy?: string | null;
  closedBy?: string | null;
  closedAt?: Date | null;
  transcriptUrl?: string | null;
  createdAt: Date;
}

export type TicketRecordDocument = TicketRecord & Document;

const TicketRecordSchema = new Schema<TicketRecord>(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    category: { type: String, default: "General Support" },
    status: {
      type: String,
      enum: ["open", "closed", "claimed"],
      default: "open",
    },
    claimedBy: { type: String, default: null },
    closedBy: { type: String, default: null },
    closedAt: { type: Date, default: null },
    transcriptUrl: { type: String, default: null },
    createdAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TicketRecordModel =
  mongoose.models.TicketRecord ??
  mongoose.model<TicketRecord>("TicketRecord", TicketRecordSchema);
