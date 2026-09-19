/**
 * Sliding Window In-Memory Rate Limiter
 * Provides IP/Identifier-based rate limiting to prevent brute force and denial of service.
 */

interface RateLimitRecord {
  timestamps: number[];
}

// Global in-memory storage so it persists across route module invocations in dev
declare global {
  var __portalRateLimits: Map<string, RateLimitRecord> | undefined;
}

if (!globalThis.__portalRateLimits) {
  globalThis.__portalRateLimits = new Map<string, RateLimitRecord>();
}

const rateLimits = globalThis.__portalRateLimits;

// Periodic cleanup of stale entries (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  rateLimits.forEach((record, key) => {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
    if (record.timestamps.length === 0) {
      rateLimits.delete(key);
    }
  });
}, 10 * 60 * 1000);

export interface RateLimitOptions {
  limit: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = rateLimits.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimits.set(key, record);
  }

  // Filter timestamps to only those within the current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0];
    const retryAfterMs = oldest + options.windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.timestamps.length,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimit(key: string): void {
  rateLimits.delete(key);
}
