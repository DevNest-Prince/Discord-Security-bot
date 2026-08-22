import { AutoResponderRuleModel, type AutoResponderRule } from "../models/AutoResponderRule.js";

export async function upsertAutoResponder(
  guildId: string,
  trigger: string,
  data: Partial<AutoResponderRule>,
): Promise<AutoResponderRule> {
  return AutoResponderRuleModel.findOneAndUpdate(
    { guildId, trigger: trigger.toLowerCase() },
    { $set: { ...data, trigger: trigger.toLowerCase() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
}

export async function deleteAutoResponder(guildId: string, trigger: string): Promise<boolean> {
  const res = await AutoResponderRuleModel.deleteOne({ guildId, trigger: trigger.toLowerCase() }).exec();
  return (res.deletedCount ?? 0) > 0;
}

export async function listAutoResponders(guildId: string): Promise<AutoResponderRule[]> {
  return AutoResponderRuleModel.find({ guildId }).exec();
}
