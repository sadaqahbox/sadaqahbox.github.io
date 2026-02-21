/**
 * CORS Configuration
 * 
 * CORS middleware configuration for auth routes and API routes.
 */

import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

/**
 * CORS configuration for auth routes
 * In production, replace origin with your actual domain
 */
export const authCors: MiddlewareHandler = cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
});
