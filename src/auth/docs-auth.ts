import { betterAuth } from "better-auth";
import { admin, apiKey, openAPI } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

/**
 * A minimal Better Auth instance safe for browser-side OpenAPI schema generation.
 * This avoids server-only dependencies like D1, KV, and Node-specific modules.
 * 
 * IMPORTANT: Keep this in sync with the main auth config in src/auth/index.ts
 * to ensure consistent OpenAPI documentation generation.
 */
export const docsAuth = betterAuth({
    baseURL: "http://localhost:5173/api/auth",
    secret: "docs-only-secret",
    plugins: [
        admin(),
        openAPI({
            disableDefaultReference: true,
            apiReference: {
                servers: [
                    { url: "/api/auth", description: "Auth API" },
                    { url: "https://sadaqahbox.apps.erklab.com/api/auth", description: "Production Auth API" }
                ]
            }
        }),
        passkey(),
        apiKey({
            enableSessionForAPIKeys: true,
            apiKeyHeaders: ["x-api-key", "X-API-Key"],
            rateLimit: {
                enabled: true,
                timeWindow: 1000 * 60 * 60, // 1 hour window
                maxRequests: 1000, // 1000 requests per hour
            },
        }),
    ],
});

export type DocsAuthInstance = typeof docsAuth;
