const DEFAULT_MAX_REQUESTS = 5;
const DEFAULT_INTERVAL_MS = 10_000;
const DEFAULT_COOLDOWN_MS = 300_000;

interface RateLimitState {
  timestamps: number[];
  cooldownUntil: number | null;
}

export interface AuditLogRateLimitOptions {
  maxRequests?: number;
  intervalMs?: number;
  cooldownMs?: number;
}

export class AuditLogRateLimiter {
  private readonly states = new Map<string, RateLimitState>();

  canFetch(
    guildId: string,
    eventName: string,
    options: AuditLogRateLimitOptions = {},
  ): boolean {
    const maxRequests =
      options.maxRequests ?? DEFAULT_MAX_REQUESTS;

    const intervalMs =
      options.intervalMs ?? DEFAULT_INTERVAL_MS;

    const cooldownMs =
      options.cooldownMs ?? DEFAULT_COOLDOWN_MS;

    const key = `${guildId}:${eventName}`;
    const now = Date.now();

    let state = this.states.get(key);

    if (!state) {
      state = {
        timestamps: [],
        cooldownUntil: null,
      };

      this.states.set(key, state);
    }

    if (
      state.cooldownUntil !== null &&
      now < state.cooldownUntil
    ) {
      return false;
    }

    if (
      state.cooldownUntil !== null &&
      now >= state.cooldownUntil
    ) {
      state.cooldownUntil = null;
    }

    state.timestamps = state.timestamps.filter(
      (timestamp) =>
        now - timestamp <= intervalMs,
    );

    if (state.timestamps.length >= maxRequests) {
      state.cooldownUntil = now + cooldownMs;
      return false;
    }

    state.timestamps.push(now);

    return true;
  }

  clearGuild(guildId: string): void {
    const prefix = `${guildId}:`;

    for (const key of this.states.keys()) {
      if (key.startsWith(prefix)) {
        this.states.delete(key);
      }
    }
  }
}