import {
  clearAntiNukeCounter,
  clearGuildAntiNukeCounters,
  incrementAntiNukeCounter,
} from "@aegisx/redis";

import type {
  AntiNukeAction,
  AntiNukeThresholdResult,
  AntiNukeTrackerOptions,
} from "./anti-nuke.types.js";

export class AntiNukeTracker {
  async record(
    options: AntiNukeTrackerOptions,
  ): Promise<AntiNukeThresholdResult> {
    const result =
      await incrementAntiNukeCounter(
        options.guildId,
        options.executorId,
        options.securityAction,
        options.windowSeconds,
      );

    return {
      count: result.count,
      threshold: options.threshold,
      triggered:
        result.count >= options.threshold,
    };
  }

  async clear(
    guildId: string,
    executorId: string,
    securityAction: AntiNukeAction,
  ): Promise<void> {
    await clearAntiNukeCounter(
      guildId,
      executorId,
      securityAction,
    );
  }

  async clearGuild(
    guildId: string,
  ): Promise<void> {
    await clearGuildAntiNukeCounters(
      guildId,
    );
  }
}

export const antiNukeTracker =
  new AntiNukeTracker();