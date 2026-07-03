/**
 * JalSejiwan - Rate Limiting Utility
 * Server-side & Client-side protection against spam and brute-force
 */
import { supabase } from '@/src/supabaseClient';

// Memory store for back-end (API routes) rate limiting
const serverStore = new Map<string, number[]>();

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Checks login rate limit in Supabase.
 * If there are more than 5 failed attempts in the last 10 minutes, blocks login.
 */
export async function checkSupabaseLoginRateLimit(identifier: string): Promise<{ limited: boolean; msg?: string }> {
  if (!identifier) return { limited: false };
  try {
    const cleanId = identifier.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    const { data, error } = await supabase
      .from('login_attempts')
      .select('attempts')
      .eq('id', cleanId)
      .single();

    if (error || !data) return { limited: false };

    const attempts: string[] = data.attempts || [];
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    
    // Filter attempts in the last 10 minutes
    const activeAttempts = attempts.filter((attemptIso: string) => {
      return new Date(attemptIso).getTime() > tenMinutesAgo;
    });
    
    if (activeAttempts.length >= 5) {
      return {
        limited: true,
        msg: 'Too many failed login attempts. This account is temporarily blocked for 10 minutes.'
      };
    }
  } catch (error: any) {
    console.error('Failed to check rate limit:', error);
    return { limited: false };
  }
  return { limited: false };
}

/**
 * Records a failed login attempt in Supabase.
 */
export async function recordFailedLoginAttempt(identifier: string): Promise<void> {
  if (!identifier) return;
  try {
    const cleanId = identifier.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    const { data } = await supabase
      .from('login_attempts')
      .select('attempts')
      .eq('id', cleanId)
      .single();
      
    const now = new Date().toISOString();
    let attempts: string[] = [];
    if (data) {
      attempts = data.attempts || [];
    }
    attempts.push(now);
    
    await supabase
      .from('login_attempts')
      .upsert({ id: cleanId, attempts });
  } catch (error) {
    console.error('Failed to record failed login attempt:', error);
  }
}

/**
 * Resets failed login attempts on successful login.
 */
export async function resetFailedLoginAttempts(identifier: string): Promise<void> {
  if (!identifier) return;
  try {
    const cleanId = identifier.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    await supabase
      .from('login_attempts')
      .upsert({ id: cleanId, attempts: [] });
  } catch (error) {
    console.error('Failed to reset login attempts:', error);
  }
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
