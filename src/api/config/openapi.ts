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
        { url: "/", description: "API Server" }
    ],
    components: {
        securitySchemes: {
            apiKeyCookie: {
                type: "apiKey",
                in: "cookie",
                name: "better-auth.session_token",
                description: "Session token cookie from better-auth",
            },
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Bearer token authentication",
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
