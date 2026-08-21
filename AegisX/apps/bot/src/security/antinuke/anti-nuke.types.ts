export type AntiNukeAction =
  | "ban"
  | "kick"
  | "strip_roles";

export interface AntiNukeConfig {
  enabled: boolean;
  action: AntiNukeAction;
  threshold: number;
  windowSeconds: number;
}

export interface AntiNukeEvent {
  guildId: string;
  executorId: string;
  targetId: string;
  eventName: string;
}

export interface AntiNukeThresholdResult {
  count: number;
  threshold: number;
  triggered: boolean;
}