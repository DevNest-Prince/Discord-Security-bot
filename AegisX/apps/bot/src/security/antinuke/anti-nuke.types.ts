export type AntiNukeAction =
  | "ban"
  | "kick"
  | "strip_roles"
  | "channel-delete"
  | "channel-create"
  | "role-delete"
  | "role-create"
  | "webhook-create"
  | "webhook-delete";

export interface AntiNukeConfig {
  enabled: boolean;
  action: "ban" | "kick" | "strip_roles";
  threshold: number;
  windowSeconds: number;
}

export interface AntiNukeEvent {
  guildId: string;
  executorId: string;
  securityAction: AntiNukeAction;
  targetId: string;
  eventName: string;
}

export interface AntiNukeThresholdResult {
  count: number;
  threshold: number;
  triggered: boolean;
}

export interface AntiNukeTrackerOptions {
  guildId: string;
  executorId: string;
  securityAction: AntiNukeAction;
  windowSeconds: number;
  threshold: number;
}