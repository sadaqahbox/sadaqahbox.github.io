/**
 * Cloudflare Cache API Integration
 * 
 * Provides edge caching for API responses to improve performance
 * and reduce database load. Cache keys are based on request URL and user session.
 */

import type { Context, Next } from "hono";

/**
 * Cache configuration options
 */
export interface CacheConfig {
    /** Cache duration in seconds (default: 60) */
    maxAge: number;
    /** Cache tags for purging (optional) */
    tags?: string[];
    /** Vary cache by user (default: true for authenticated routes) */
    varyByUser?: boolean;
    /** Custom cache key generator */
    keyGenerator?: (c: Context) => string;
}

const DEFAULT_CONFIG: CacheConfig = {
    maxAge: 60,
    varyByUser: true,
};

/**
 * Generate a cache key for the request
 */
function generateCacheKey(c: Context, varyByUser: boolean): string {
    const url = new URL(c.req.url);
    const path = url.pathname + url.search;
    
    // Include user ID in cache key for authenticated routes
    const userId = varyByUser ? c.get("user")?.id : null;
    
    if (userId) {
        return `${path}:user=${userId}`;
    }
    
    return path;
}

/**
 * Middleware to cache API responses using Cloudflare Cache API
 * 
 * @example
 * app.get("/api/boxes", cacheResponse({ maxAge: 300 }), listHandler);
 */
export function cacheResponse(config: Partial<CacheConfig> = {}) {
    const opts = { ...DEFAULT_CONFIG, ...config };

    return async function cacheMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
        // Skip caching for non-GET requests
        if (c.req.method !== "GET") {
            return next();
        }

        // Skip caching if Cache API is not available (local dev)
        // Use type assertion since caches may not be in the Env type
        const caches = (c.env as { caches?: CacheStorage }).caches;
        if (!caches) {
            return next();
        }

        const cacheKey = opts.keyGenerator?.(c) ?? generateCacheKey(c, opts.varyByUser ?? true);
        const cache = await caches.open("api-cache");

        // Try to get cached response
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
            // Return cached response with header indicating cache hit
            const headers = new Headers(cachedResponse.headers);
            headers.set("X-Cache", "HIT");
            
            return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers,
            });
        }

        // Proceed to handler
        await next();

        // Only cache successful responses
        const response = c.res;
        if (response && response.status >= 200 && response.status < 300) {
            // Clone response for caching
            const responseToCache = response.clone();
            
            // Add cache headers
            response.headers.set("Cache-Control", `max-age=${opts.maxAge}`);
            response.headers.set("X-Cache", "MISS");
            
            if (opts.tags) {
                response.headers.set("Cache-Tags", opts.tags.join(","));
            }

            // Store in cache
            await cache.put(cacheKey, responseToCache);
        }
    };
}

/**
 * Purge cache by tag or pattern
 * Useful for cache invalidation after mutations
 */
export async function purgeCache(
    caches: CacheStorage,
    pattern?: string,
    tags?: string[]
): Promise<number> {
    const cache = await caches.open("api-cache");
    const keys = await cache.keys();
    let purgedCount = 0;

    for (const request of keys) {
        const url = new URL(request.url);
        
        // Purge by URL pattern
        if (pattern && url.pathname.includes(pattern)) {
            await cache.delete(request);
            purgedCount++;
            continue;
        }

        // Purge by cache tags (requires custom header storage)
        // This is a simplified implementation
        if (tags) {
            const cachedResponse = await cache.match(request);
            const cacheTags = cachedResponse?.headers.get("Cache-Tags");
            if (cacheTags && tags.some((t) => cacheTags.includes(t))) {
                await cache.delete(request);
                purgedCount++;
            }
        }
    }

    return purgedCount;
}

/**
 * Middleware to automatically purge cache after mutations
 * 
 * @example
 * app.post("/api/boxes", purgeCacheAfter({ patterns: ["/api/boxes", "/api/stats"] }), createHandler);
 */
export function purgeCacheAfter(config: { patterns?: string[]; tags?: string[] }) {
    return async function purgeMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
        await next();

        // Only purge on successful mutations
        if (c.res && c.res.status >= 200 && c.res.status < 300) {
            const caches = (c.env as { caches?: CacheStorage }).caches;
            if (caches) {
                for (const pattern of config.patterns ?? []) {
                    await purgeCache(caches, pattern);
                }
                for (const tag of config.tags ?? []) {
                    await purgeCache(caches, undefined, [tag]);
                }
            }
        }
    };
}

/**
 * Cache middleware presets for common use cases
 */
export const cachePresets = {
    /** Short cache for frequently changing data (30s) */
    short: cacheResponse({ maxAge: 30 }),
    
    /** Medium cache for semi-static data (5 minutes) */
    medium: cacheResponse({ maxAge: 300 }),
    
    /** Long cache for static data (1 hour) */
    long: cacheResponse({ maxAge: 3600 }),
    
    /** Cache for public data (no user vary) */
    public: cacheResponse({ maxAge: 300, varyByUser: false }),
};
