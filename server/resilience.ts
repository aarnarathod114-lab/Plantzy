/**
 * Helpers for calling an upstream service that is sometimes slow or overloaded.
 * Pure and dependency-free so the behaviour can be unit-tested.
 */

export class TimeoutError extends Error {
  constructor(message = 'The request timed out.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/** Reject with `TimeoutError` if `promise` has not settled within `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export interface FallbackOptions {
  /** Total time allowed across all candidates. */
  budgetMs: number;
  /** Time allowed for any single candidate. */
  perAttemptMs: number;
  now?: () => number;
  /** Called when a candidate fails and another will be tried, or the list is exhausted. */
  onFailure?: (candidate: string, error: unknown) => void;
}

/**
 * Try each candidate in order and return the first success.
 *
 * Used to fall back from the preferred model to alternatives when it is
 * overloaded, rate limited or slow. Every attempt is bounded, and the whole
 * sequence stops when the budget is spent, so the caller always gets an answer
 * or an error before the hosting platform's own request limit.
 */
export async function firstSuccessful<T>(
  candidates: readonly string[],
  attempt: (candidate: string) => Promise<T>,
  options: FallbackOptions
): Promise<T> {
  const now = options.now ?? Date.now;
  const deadline = now() + options.budgetMs;
  let lastError: unknown = new Error('No candidates were provided.');

  for (const candidate of candidates) {
    const remaining = deadline - now();
    if (remaining <= 0) {
      lastError = new TimeoutError();
      break;
    }
    try {
      return await withTimeout(attempt(candidate), Math.min(options.perAttemptMs, remaining));
    } catch (error) {
      lastError = error;
      options.onFailure?.(candidate, error);
    }
  }
  throw lastError;
}

/** De-duplicate while keeping order, dropping empty entries. */
export function uniqueInOrder(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
