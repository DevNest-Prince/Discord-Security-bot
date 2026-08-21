interface CounterState {
  timestamps: number[];
}

export interface AntiNukeThresholdResult {
  count: number;
  threshold: number;
  triggered: boolean;
}

export class AntiNukeTracker {
  private readonly counters = new Map<
    string,
    CounterState
  >();

  record(
    guildId: string,
    executorId: string,
    eventName: string,
    windowSeconds: number,
    threshold: number,
  ): AntiNukeThresholdResult {
    const key =
      `${guildId}:${executorId}:${eventName}`;

    const now = Date.now();
    const windowMs = windowSeconds * 1000;

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
      threshold,
      triggered:
        state.timestamps.length >= threshold,
    };
  }

  clear(
    guildId: string,
    executorId: string,
    eventName: string,
  ): void {
    this.counters.delete(
      `${guildId}:${executorId}:${eventName}`,
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
    const windowMs = windowSeconds * 1000;

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
}

export const antiNukeTracker =
  new AntiNukeTracker();