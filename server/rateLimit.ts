/**
 * Fixed-window, in-memory rate limiter.
 *
 * Deliberately dependency-free and process-local: Plantzy runs as a single
 * Node process. If it is ever scaled horizontally, swap this for a shared
 * store (Redis) behind the same `check` signature.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the caller's window resets. */
  retryAfterSec: number;
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitResult;
  size(): number;
}

interface Window {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  /** Hard cap on tracked keys so a flood of unique IPs cannot grow memory unbounded. */
  maxKeys?: number;
}): RateLimiter {
  const { windowMs, max, maxKeys = 10_000 } = options;
  const windows = new Map<string, Window>();

  function evictExpired(now: number) {
    for (const [key, win] of windows) {
      if (win.resetAt <= now) windows.delete(key);
    }
  }

  return {
    check(key, now = Date.now()) {
      let win = windows.get(key);

      if (!win || win.resetAt <= now) {
        if (windows.size >= maxKeys) evictExpired(now);
        if (windows.size >= maxKeys) {
          // Still full of live windows: drop the oldest entry (Map keeps insertion order).
          const oldest = windows.keys().next().value;
          if (oldest !== undefined) windows.delete(oldest);
        }
        win = { count: 0, resetAt: now + windowMs };
        windows.delete(key);
        windows.set(key, win);
      }

      win.count += 1;
      const allowed = win.count <= max;
      return {
        allowed,
        remaining: Math.max(0, max - win.count),
        retryAfterSec: Math.max(1, Math.ceil((win.resetAt - now) / 1000)),
      };
    },
    size() {
      return windows.size;
    },
  };
}
