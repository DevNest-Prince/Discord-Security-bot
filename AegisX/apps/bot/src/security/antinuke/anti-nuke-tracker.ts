import type {
  AntiNukeAction,
  AntiNukeThresholdResult,
  AntiNukeTrackerOptions,
} from "./anti-nuke.types.js";

interface CounterState {
  timestamps: number[];
}

export class AntiNukeTracker {
  private readonly counters = new Map<
    string,
    CounterState
  >();

  record(
    options: AntiNukeTrackerOptions,
  ): AntiNukeThresholdResult {
    const key = this.createKey(
      options.guildId,
      options.executorId,
      options.securityAction,
    );

    const now = Date.now();
    const windowMs =
      options.windowSeconds * 1000;

    const state =
      this.counters.get(key) ?? {
        timestamps: [],
      };

    state.timestamps = state.timestamps.filter(
      (timestamp) =>
        now - timestamp <= windowMs,
    );

    state.timestamps.push(now);

    this.counters.set(key, state);

    return {
      count: state.timestamps.length,
      threshold: options.threshold,
      triggered:
        state.timestamps.length >=
        options.threshold,
    };
  }

  clear(
    guildId: string,
    executorId: string,
    securityAction: AntiNukeAction,
  ): void {
    this.counters.delete(
      this.createKey(
        guildId,
        executorId,
        securityAction,
      ),
    );
  }

  clearGuild(guildId: string): void {
    const prefix = `${guildId}:`;

    for (const key of this.counters.keys()) {
      if (key.startsWith(prefix)) {
        this.counters.delete(key);
      }
    }
  }

  clearExpired(
    windowSeconds: number,
  ): void {
    const now = Date.now();
    const windowMs =
      windowSeconds * 1000;

    for (const [key, state] of this.counters) {
      state.timestamps = state.timestamps.filter(
        (timestamp) =>
          now - timestamp <= windowMs,
      );

      if (state.timestamps.length === 0) {
        this.counters.delete(key);
      }
    }
  }

  private createKey(
    guildId: string,
    executorId: string,
    securityAction: AntiNukeAction,
  ): string {
    return [
      guildId,
      executorId,
      securityAction,
    ].join(":");
  }
}

export const antiNukeTracker =
  new AntiNukeTracker();