/**
 * JalSejiwan - Rate Limiting Utility
 * Server-side & Client-side protection against spam and brute-force
 */

// Memory store for back-end (API routes) rate limiting
const serverStore = new Map<string, number[]>();

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Checks rate limits on server side or in-memory operations.
 * Defaults to 100 requests per 15 minutes.
 */
export function countAndCheckLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const timestamps = serverStore.get(key) || [];
  
  // Filter out expired timestamps
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);
  
  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0] || now;
    const resetTime = oldest + windowMs;
    return {
      limited: true,
      remaining: 0,
      resetTime,
    };
  }
  
  validTimestamps.push(now);
  serverStore.set(key, validTimestamps);
  
  // Periodic self-cleaning with 5% chance
  if (Math.random() < 0.05) {
    for (const [k, v] of serverStore.entries()) {
      const active = v.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        serverStore.delete(k);
      } else {
        serverStore.set(k, active);
      }
    }
  }

  return {
    limited: false,
    remaining: limit - validTimestamps.length,
    resetTime: now + windowMs,
  };
}

/**
 * Client-side Rate Limiter powered by localStorage
 * Prevents client spamming (Login, WhatsApp Reminders, PDF billing generations)
 */
export function checkClientRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { limited: boolean; msg?: string; remaining: number } {
  if (typeof window === 'undefined') {
    return { limited: false, remaining: limit };
  }

  try {
    const storageKey = `rate_limit_${key}`;
    const stored = localStorage.getItem(storageKey);
    const now = Math.floor(Date.now() / 1000);

    let timestamps: number[] = [];
    if (stored) {
      try {
        timestamps = JSON.parse(stored);
      } catch {
        timestamps = [];
      }
    }

    // Filter to last window
    timestamps = timestamps.filter((t) => now - t < windowSeconds);

    if (timestamps.length >= limit) {
      const oldest = timestamps[0] || now;
      const secondsLeft = Math.max(1, oldest + windowSeconds - now);
      const minutesLeft = Math.ceil(secondsLeft / 60);
      
      let timeStr = `${secondsLeft}s`;
      if (secondsLeft >= 60) {
        timeStr = `${minutesLeft} min`;
      }

      return {
        limited: true,
        remaining: 0,
        msg: `Too many attempts. Please try again in ${timeStr}.`,
      };
    }

    timestamps.push(now);
    localStorage.setItem(storageKey, JSON.stringify(timestamps));

    return {
      limited: false,
      remaining: limit - timestamps.length,
    };
  } catch (e) {
    console.error('Failed to check client rate limit', e);
    return { limited: false, remaining: limit };
  }
}
