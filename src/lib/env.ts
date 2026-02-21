/**
 * Environment Variable Validation
 *
 * Type-safe environment variable validation with Zod schemas.
 * Provides clear error messages for missing/invalid configuration.
 */

import { z, type ZodIssue } from "zod";

/**
 * Server-side environment variables
 * These are validated at runtime on the server
 */
const serverEnvSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "fatal"]).default("info"),

    // Security
    CSRF_SECRET: z.string().min(32).optional(),
    SESSION_SECRET: z.string().min(32).optional(),

    // CORS
    ALLOWED_ORIGINS: z.string().optional(),

    // App info
    APP_VERSION: z.string().optional(),
});

/**
 * Client-side environment variables
 * These must be prefixed with VITE_ to be exposed to the client
 */
const clientEnvSchema = z.object({
    // API URL - can be absolute (https://...) for separated deployments
    // or relative (/api) for combined deployments
    VITE_API_URL: z.string().default("/api"),
});

/**
 * Combined environment schema
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema);

/**
 * Type definitions for environment variables
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate server environment variables
 */
function parseServerEnv(): ServerEnv {
    // In Cloudflare Workers, use globalThis or process.env
    const env = typeof process !== "undefined" ? process.env : {};

    const result = serverEnvSchema.safeParse(env);

    if (!result.success) {
        console.error("❌ Invalid server environment variables:");
        result.error.issues.forEach((error: ZodIssue) => {
            console.error(`  - ${error.path.join(".")}: ${error.message}`);
        });
        throw new Error("Invalid server environment configuration");
    }

    return result.data;
}

/**
 * Parse and validate client environment variables
 */
function parseClientEnv(): ClientEnv {
    // In browser, use import.meta.env
    const env = typeof import.meta !== "undefined" && "env" in import.meta
        ? (import.meta as unknown as { env: Record<string, string> }).env
        : {};

    const result = clientEnvSchema.safeParse(env);

    if (!result.success) {
        console.error("❌ Invalid client environment variables:");
        result.error.issues.forEach((error: ZodIssue) => {
            console.error(`  - ${error.path.join(".")}: ${error.message}`);
        });
        throw new Error("Invalid client environment configuration");
    }

    return result.data;
}

// Singleton instances
let serverEnv: ServerEnv | null = null;
let clientEnv: ClientEnv | null = null;

/**
 * Get validated server environment variables
 */
export function getServerEnv(): ServerEnv {
    if (!serverEnv) {
        serverEnv = parseServerEnv();
    }
    return serverEnv;
}

/**
 * Get validated client environment variables
 */
export function getClientEnv(): ClientEnv {
    if (!clientEnv) {
        clientEnv = parseClientEnv();
    }
    return clientEnv;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
    return getServerEnv().NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
    return getServerEnv().NODE_ENV === "development";
}

/**
 * Get log level
 */
export function getLogLevel(): string {
    return getServerEnv().LOG_LEVEL;
}

/**
 * Get allowed CORS origins
 */
export function getAllowedOrigins(): string[] {
    const origins = getServerEnv().ALLOWED_ORIGINS;
    return origins ? origins.split(",").map((o: string) => o.trim()) : [];
}

/**
 * Get CSRF secret (generates a warning if using default in production)
 */
export function getCSRFSecret(): string {
    const secret = getServerEnv().CSRF_SECRET;
    if (!secret && isProduction()) {
        console.warn("⚠️ CSRF_SECRET not set in production, using fallback");
    }
    return secret || "dev-secret-change-in-production";
}
