/**
 * Main API Application - Refactored
 * 
 * Sets up the OpenAPIHono app with OpenAPI documentation,
 * middleware, and route registration.
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";

import { requestLogger, errorHandler, securityHeaders } from "./middleware";
import { registerRoutes } from "./shared/route-builder";

import { openApiConfig, scalarConfig } from "./config/openapi";
import { authCors } from "./setup/cors";
import { handleAuthRoute } from "./setup/auth";

// Import route definitions
import { healthRouteDefinitions } from "./endpoints/health";
import { statsRouteDefinitions } from "./endpoints/stats";
import { boxRouteDefinitions } from "./endpoints/boxes";
import { sadaqahRouteDefinitions } from "./endpoints/sadaqahs";
import { currencyRouteDefinitions } from "./endpoints/currencies";
import { currencyTypeRouteDefinitions } from "./endpoints/currency-types";
import { tagRouteDefinitions } from "./endpoints/tags";

// ============== App Initialization ==============

const app = new OpenAPIHono<{ Bindings: Env }>();

// ============== Middleware Setup ==============

// CORS for auth routes and API routes
app.use("/api/auth/**", authCors);
app.use("/api/*", authCors);

// Global middleware
app.use("*", securityHeaders());
app.use("*", requestLogger);
app.use("*", errorHandler);

// ============== Route Handlers ==============

// Auth routes - handled by better-auth
app.all("/api/auth/*", handleAuthRoute);

// API routes (OpenAPI documented)
registerRoutes(app, healthRouteDefinitions);
registerRoutes(app, statsRouteDefinitions);
registerRoutes(app, boxRouteDefinitions);
registerRoutes(app, sadaqahRouteDefinitions);
registerRoutes(app, currencyRouteDefinitions);
registerRoutes(app, currencyTypeRouteDefinitions);
registerRoutes(app, tagRouteDefinitions);

// ============== Documentation ==============

app.doc("/api/open-api", openApiConfig);
app.get("/api/docs", Scalar(scalarConfig));

// ============== SPA Fallback ==============

app.get("/*", async (c) => {
    const path = c.req.path;

    // API routes should 404 if not matched
    if (path.startsWith("/api/") || path === "/doc") {
        return c.notFound();
    }

    // For SPA routes (no file extension), serve index.html
    if (!path.includes(".")) {
        return c.env.ASSETS.fetch(new Request(`${new URL(c.req.url).origin}/index.html`));
    }

    // Try to serve static assets directly
    return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
