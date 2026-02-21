/**
 * CORS Configuration
 *
 * CORS middleware configuration for auth routes and API routes.
 * Uses environment-based origin configuration for production safety.
 */

import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
    const env = typeof process !== "undefined" ? (process.env as Record<string, string | undefined>) : {};
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(",") || [];

    // Production: only allow configured origins
    if (env.NODE_ENV === "production") {
        if (allowedOrigins.length > 0) {
            return allowedOrigins;
        }
        // If no origins configured, return empty array (restrictive)
        return [];
    }

    // Development: allow common local dev ports
    const devOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ];

    return [...devOrigins, ...allowedOrigins];
}

/**
 * CORS configuration for auth routes
 */
export const authCors: MiddlewareHandler = cors({
    origin: getAllowedOrigins(),
    allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    allowMethods: ["POST", "GET", "OPTIONS", "DELETE", "PATCH"],
    exposeHeaders: ["Content-Length", "X-Request-ID"],
    maxAge: 600,
    credentials: true,
});

/**
 * API CORS configuration
 */
export const apiCors: MiddlewareHandler = cors({
    origin: getAllowedOrigins(),
    allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Request-ID"],
    maxAge: 600,
    credentials: true,
});
