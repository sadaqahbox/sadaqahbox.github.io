import type { D1Database, IncomingRequestCfProperties, KVNamespace } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { admin, anonymous, apiKey, openAPI } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "../db";
import { passkey } from "@better-auth/passkey"

// Use KVNamespace from @cloudflare/workers-types to match better-auth-cloudflare
type AuthEnv = { DB: D1Database; AUTH_KV?: KVNamespace<string> };

// Single auth configuration that handles both CLI and runtime scenarios
function createAuth(env?: AuthEnv, cf?: IncomingRequestCfProperties) {
    // Use actual DB for runtime, empty object for CLI
    // Disable logger for better performance (set to true only when debugging)
    const enableLogging = false;
    const db = env ? drizzle(env.DB, { schema, logger: enableLogging }) : ({} as any);

    return betterAuth({
        ...withCloudflare(
            {
                autoDetectIpAddress: true,
                geolocationTracking: true,
                cf: cf || {},
                d1: env
                    ? {
                        db,
                        options: {
                            usePlural: true,
                            debugLogs: enableLogging,
                        },
                    }
                    : undefined,
                kv: env?.AUTH_KV,
            },
            {
                emailAndPassword: {
                    enabled: true,
                },
                user: {
                    additionalFields: {
                        defaultBoxId: {
                            type: "string",
                            required: false,
                            input: true,
                        },
                        preferredCurrencyId: {
                            type: "string",
                            required: false,
                            input: true,
                            defaultValue: "cur_279",
                        },
                    },
                },
                advanced: {
                    cookiePrefix: "sadaqahbox",
                    useSecureCookies: false,
                    defaultCookieAttributes: {
                        secure: false,
                        sameSite: "lax",
                        path: "/",
                    },
                },
                plugins: [
                    admin() as any,
                    anonymous(),
                    openAPI({
                        disableDefaultReference: true,
                        apiReference: {
                            servers: [
                                { url: "/api/auth", description: "Auth API" }
                            ]
                        }
                    }),
                    passkey(),
                    apiKey(),
                ],
                rateLimit: {
                    enabled: true,
                    window: 60, // Minimum KV TTL is 60s
                    max: 100, // reqs/window
                    customRules: {
                        // https://github.com/better-auth/better-auth/issues/5452
                        "/sign-in/email": {
                            window: 60,
                            max: 100,
                        },
                        "/sign-in/social": {
                            window: 60,
                            max: 100,
                        },
                    },
                },
            }
        ),
        // Only add database adapter for CLI schema generation
        ...(env
            ? {}
            : {
                database: drizzleAdapter({} as D1Database, {
                    provider: "sqlite",
                    usePlural: true,
                    debugLogs: true,
                }),
            }),
    });
}

// Export for runtime usage
export { createAuth };

// Export type for client-side inference
export type AuthInstance = ReturnType<typeof createAuth>;

// Create a default auth instance for CLI schema generation
// This will be overridden at runtime with actual env/cf
const auth = createAuth();
export default auth;
export { auth };
