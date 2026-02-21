import { betterAuth } from "better-auth";
import { admin, apiKey, openAPI } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";

/**
 * A minimal Better Auth instance safe for browser-side OpenAPI schema generation.
 * This avoids server-only dependencies like D1, KV, and Node-specific modules.
 */
export const docsAuth = betterAuth({
  baseURL: "http://localhost:5173/api/auth",
  secret: "docs-only-secret",
  plugins: [
    admin(),
    openAPI({
      disableDefaultReference: true,
      apiReference: {
        servers: [{ url: "/api/auth", description: "Auth API" }]
      }
    }),
    passkey(),
    apiKey(),
  ],
});

export type DocsAuthInstance = typeof docsAuth;
