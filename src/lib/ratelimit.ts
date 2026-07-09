/**
 * Rate limiting utilities for client-side protection
 */

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check if a request is allowed under rate limit
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    rateLimitMap.set(key, { timestamps: [now] });
    return true;
  }

  // Remove old timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}

/**
 * Get rate limit status for a key
 */
export function getRateLimitStatus(
  key: string,
  maxRequests: number,
  windowMs: number
): {
  isAllowed: boolean;
  remainingRequests: number;
  resetIn: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    return {
      isAllowed: true,
      remainingRequests: maxRequests,
      resetIn: 0,
    };
  }

  // Remove old timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  const remaining = Math.max(0, maxRequests - entry.timestamps.length);
  const oldestTimestamp = entry.timestamps[0];
  const resetIn = oldestTimestamp
    ? Math.ceil((oldestTimestamp + windowMs - now) / 1000)
    : 0;

  return {
    isAllowed: remaining > 0,
    remainingRequests: remaining,
    resetIn,
  };
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * Middleware-style rate limit check for search
 * Returns { allowed, remaining, message }
 */
export function searchRateLimit(
  ip: string = "default"
): {
  allowed: boolean;
  remaining: number;
  message?: string;
} {
  const maxRequests = 30;
  const windowMs = 60000; // 1 minute

  if (!checkRateLimit(`search:${ip}`, maxRequests, windowMs)) {
    const status = getRateLimitStatus(`search:${ip}`, maxRequests, windowMs);
    return {
      allowed: false,
      remaining: 0,
      message: `Terlalu banyak pencarian. Coba lagi dalam ${status.resetIn} detik.`,
    };
  }

  const status = getRateLimitStatus(`search:${ip}`, maxRequests, windowMs);
  return {
    allowed: true,
    remaining: status.remainingRequests,
  };
}

/**
 * General route rate limit
 */
export function routeRateLimit(
  route: string,
  ip: string = "default"
): boolean {
  return checkRateLimit(`route:${route}:${ip}`, 200, 60000);
}
