/**
 * CORS Configuration
 *
 * Custom CORS middleware for auth routes and API routes.
 * Supports both same-origin (combined deployment) and cross-origin (separated deployment) setups.
 *
 * We intentionally avoid Hono's built-in cors() middleware because it uses
 * c.res.headers.set() for OPTIONS preflight early-return responses. In Cloudflare's
 * Workers runtime, Response headers can be immutable, causing those set() calls
 * to silently fail and returning an empty Access-Control-Allow-Credentials header.
 * Using c.header() (Hono's proper header API) avoids this issue entirely.
 */

import type { MiddlewareHandler } from "hono";

// Default development origins
const DEV_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
];

function parseAllowedOrigins(originsString?: string): string[] {
    if (!originsString) return [];
    return originsString.split(",").map(o => o.trim()).filter(Boolean);
}

function createCorsMiddleware(): MiddlewareHandler {
    return async (c, next) => {
        const requestOrigin = c.req.header("origin");

        // Build allowed origins list from env + dev defaults
        const configuredOrigins = parseAllowedOrigins(c.env.ALLOWED_ORIGINS as string | undefined);
        const isDev = (c.env.NODE_ENV as string | undefined) !== "production";
        const allowedOrigins = isDev
            ? [...DEV_ORIGINS, ...configuredOrigins]
            : configuredOrigins;

        // Determine if this origin is allowed
        const allowOrigin =
            !requestOrigin                              // no origin → same-origin request → allow
                || allowedOrigins.length === 0              // no restrictions configured → allow all
                || allowedOrigins.includes(requestOrigin)   // explicit match → allow
                ? requestOrigin ?? null
                : null;

        // Apply CORS headers via c.header() — Hono's proper API that works in all environments
        if (allowOrigin) {
            c.header("Access-Control-Allow-Origin", allowOrigin);
            c.header("Access-Control-Allow-Credentials", "true");
            c.header("Vary", "Origin");
        }

        // Handle preflight OPTIONS requests — return early with CORS headers
        if (c.req.method === "OPTIONS") {
            // Build headers explicitly on a fresh mutable object — avoids Cloudflare immutable-headers edge case
            const preflightHeaders = new Headers();
            if (allowOrigin) {
                preflightHeaders.set("Access-Control-Allow-Origin", allowOrigin);
                preflightHeaders.set("Access-Control-Allow-Credentials", "true");
                preflightHeaders.set("Vary", "Origin");
            }
            preflightHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
            preflightHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
            preflightHeaders.set("Access-Control-Expose-Headers", "Content-Length, X-Request-ID");
            preflightHeaders.set("Access-Control-Max-Age", "600");
            return new Response(null, { status: 204, statusText: "No Content", headers: preflightHeaders });
        }

        await next();
    };
}

/**
 * CORS configuration for auth routes and API routes
 */
export const authCors: MiddlewareHandler = createCorsMiddleware();
export const apiCors: MiddlewareHandler = createCorsMiddleware();
