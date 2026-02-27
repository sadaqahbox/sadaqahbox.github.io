/**
 * OpenAPI Configuration
 * 
 * Centralized OpenAPI documentation configuration for the API.
 */

import type { OpenAPIObject } from "openapi3-ts/oas31";

/**
 * OpenAPI document configuration
 */
export const openApiConfig: OpenAPIObject = {
    openapi: "3.1.1",
    info: {
        version: "1.0.0",
        title: "SadaqahBox API",
        description: "API for managing charity boxes and sadaqahs",
    },
    servers: [
        { url: "/", description: "Current Server" },
        { url: "https://sadaqahbox.apps.erklab.com/api", description: "Production" }
    ],
    components: {
        securitySchemes: {
            // Session cookie authentication (better-auth session token)
            apiKeyCookie: {
                type: "apiKey",
                in: "cookie",
                name: "sadaqahbox.session_token",
                description: "Session token cookie from better-auth",
            },
            // Bearer token authentication (for API keys)
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "API Key",
                description: "API Key authentication via Bearer token or x-api-key header",
            },
            // API Key header authentication (alternative to bearer)
            apiKeyHeader: {
                type: "apiKey",
                in: "header",
                name: "x-api-key",
                description: "API Key provided in x-api-key header",
            },
        },
    },
};

/**
 * Scalar API reference configuration
 */
export const scalarConfig = {
    pageTitle: "API Documentation",
    sources: [
        { url: "/api/open-api", title: "API" },
        { url: "/api/auth/open-api/generate-schema", title: "Auth" },
    ],
};
