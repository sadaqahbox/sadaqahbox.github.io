/**
 * Rate Limiting Middleware
 *
 * Implements rate limiting for API routes using in-memory sliding window.
 * For production, consider using Redis or Cloudflare KV for distributed rate limiting.
 */

import type { Context, Next } from "hono";

export interface RateLimitConfig {
    /** Maximum number of requests per window (default: 100) */
    maxRequests: number;
    /** Window size in seconds (default: 60) */
    windowSeconds: number;
    /** Custom key generator function */
    keyGenerator?: (c: Context) => string;
    /** Skip rate limiting for these paths */
    skipPaths?: string[];
    /** Custom handler for rate limit exceeded */
    onLimitExceeded?: (c: Context, retryAfter: number) => Response | Promise<Response>;
}

interface RequestRecord {
    count: number;
    resetTime: number;
}

// In-memory store (use Redis/KV in production)
const requestStore = new Map<string, RequestRecord>();

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 100,
    windowSeconds: 60,
};

/**
 * Generate rate limit key from request
 */
function defaultKeyGenerator(c: Context): string {
    // Use IP address as key, fallback to "unknown"
    const ip = c.req.header("cf-connecting-ip") ||
               c.req.header("x-forwarded-for") ||
               c.req.header("x-real-ip") ||
               "unknown";
    return `ratelimit:${ip}`;
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, record] of requestStore.entries()) {
        if (record.resetTime <= now) {
            requestStore.delete(key);
        }
    }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Rate limiting middleware factory
 */
export function rateLimit(config: Partial<RateLimitConfig> = {}) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const keyGen = fullConfig.keyGenerator || defaultKeyGenerator;

    return async function rateLimitMiddleware(c: Context, next: Next) {
        // Skip rate limiting for configured paths
        if (fullConfig.skipPaths?.some(path => c.req.path.startsWith(path))) {
            return next();
        }

        const key = keyGen(c);
        const now = Date.now();
        const windowMs = fullConfig.windowSeconds * 1000;

        let record = requestStore.get(key);

        // Create new record or reset if expired
        if (!record || record.resetTime <= now) {
            record = {
                count: 1,
                resetTime: now + windowMs,
            };
            requestStore.set(key, record);
        } else {
            record.count++;
        }

        // Calculate retry after
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);

        // Set rate limit headers
        c.header("X-RateLimit-Limit", String(fullConfig.maxRequests));
        c.header("X-RateLimit-Remaining", String(Math.max(0, fullConfig.maxRequests - record.count)));
        c.header("X-RateLimit-Reset", String(Math.ceil(record.resetTime / 1000)));

        // Check if limit exceeded
        if (record.count > fullConfig.maxRequests) {
            c.header("Retry-After", String(retryAfter));

            if (fullConfig.onLimitExceeded) {
                const response = await fullConfig.onLimitExceeded(c, retryAfter);
                return response;
            }

            return c.json(
                {
                    success: false,
                    error: "Rate limit exceeded",
                    retryAfter,
                },
                429
            );
        }

        return next();
    };
}

/**
 * Strict rate limit for sensitive routes (auth, etc.)
 */
export function strictRateLimit(config: Partial<RateLimitConfig> = {}) {
    return rateLimit({
        maxRequests: 5,
        windowSeconds: 60,
        ...config,
    });
}

/**
 * API rate limit for general API routes
 */
export function apiRateLimit(config: Partial<RateLimitConfig> = {}) {
    return rateLimit({
        maxRequests: 100,
        windowSeconds: 60,
        ...config,
    });
}
