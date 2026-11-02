export interface RateLimitEntry {
  failures: number;
  lastAttempt: number;
  lockedUntil?: number;
}

export class ProgressiveRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxAttempts = 6;
  private lockoutDurationMs = 15 * 60 * 1000; // 15 minutes
  private failureWindowMs = 60 * 60 * 1000; // 1 hour

  constructor(maxAttempts = 6, lockoutDurationMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.lockoutDurationMs = lockoutDurationMs;

    // Periodic sweep every 10 minutes to prevent memory leaks
    if (typeof setInterval !== 'undefined') {
      const interval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
      if (interval.unref) interval.unref();
    }
  }

  /**
   * Checks if an identifier (IP address, email, or composite key) is currently locked out.
   * Throws an error or returns status if locked.
   */
  public check(key: string): { isLocked: boolean; remainingLockoutSeconds: number; delayMs: number } {
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry) {
      return { isLocked: false, remainingLockoutSeconds: 0, delayMs: 0 };
    }

    // Check if lockout is still active
    if (entry.lockedUntil && entry.lockedUntil > now) {
      const remaining = Math.ceil((entry.lockedUntil - now) / 1000);
      return { isLocked: true, remainingLockoutSeconds: remaining, delayMs: 0 };
    }

    // Check if failure entry has expired beyond failure window
    if (now - entry.lastAttempt > this.failureWindowMs) {
      this.store.delete(key);
      return { isLocked: false, remainingLockoutSeconds: 0, delayMs: 0 };
    }

    // Progressive delay calculation for attempts approaching lockout:
    // 1-3 attempts: 0ms
    // 4 attempts: 500ms
    // 5 attempts: 1000ms
    let delayMs = 0;
    if (entry.failures >= 4 && entry.failures < this.maxAttempts) {
      delayMs = (entry.failures - 3) * 500;
    }

    return { isLocked: false, remainingLockoutSeconds: 0, delayMs };
  }

  /**
   * Records a failed attempt for the identifier.
   * Increments failure count, applies progressive delay, or triggers lockout if limit exceeded.
   */
  public async recordFailure(key: string): Promise<{ isLocked: boolean; delayMs: number; failures: number }> {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now - entry.lastAttempt > this.failureWindowMs) {
      entry = { failures: 1, lastAttempt: now };
    } else {
      entry.failures += 1;
      entry.lastAttempt = now;
    }

    let delayMs = 0;

    if (entry.failures >= this.maxAttempts) {
      entry.lockedUntil = now + this.lockoutDurationMs;
      this.store.set(key, entry);
      return { isLocked: true, delayMs: 0, failures: entry.failures };
    }

    if (entry.failures >= 4) {
      delayMs = (entry.failures - 3) * 500;
    }

    this.store.set(key, entry);

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return { isLocked: false, delayMs, failures: entry.failures };
  }

  /**
   * Records a successful attempt, resetting failure count.
   */
  public recordSuccess(key: string): void {
    this.store.delete(key);
  }

  /**
   * Removes stale entries to keep memory usage bounded.
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.lockedUntil && entry.lockedUntil <= now) {
        this.store.delete(key);
      } else if (now - entry.lastAttempt > this.failureWindowMs) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Resets the entire rate limiter (useful for tests).
   */
  public reset(): void {
    this.store.clear();
  }
}

export const authRateLimiter = new ProgressiveRateLimiter();

