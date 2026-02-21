/**
 * Main API Application
 * 
 * Sets up the OpenAPIHono app with OpenAPI documentation,
 * middleware, and route registration.
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { errorHandler, requestLogger } from "./middleware";
import { getBoxEntity } from "./entities";
import { success } from "./shared/response";
import { registerRoutes } from "./routes";
import { createAuth,auth } from "../auth";
import { Scalar } from "@scalar/hono-api-reference";

// Initialize OpenAPIHono app
const app = new OpenAPIHono<{ Bindings: Env }>();

// CORS configuration for auth routes
app.use(
    "/api/auth/**",
    cors({
        origin: "*", // In production, replace with your actual domain
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS"],
        exposeHeaders: ["Content-Length"],
        maxAge: 600,
        credentials: true,
    })
);

// Apply global middleware
app.use("*", requestLogger);
app.use("*", errorHandler);

// Handle all auth routes
app.all("/api/auth/*", async (c) => {
    const auth = createAuth(c.env as unknown as Parameters<typeof createAuth>[0], (c.req.raw as any).cf || {});
    return auth.handler(c.req.raw);
});

// Register all API routes
registerRoutes(app);

// OpenAPI documentation endpoint
app.doc("/api/open-api", {
    openapi: "3.1.1",
    info: {
        version: "1.0.0",
        title: "SadaqahBox API",
        description: "API for managing charity boxes and sadaqahs",
    },
});

// Scalar API reference UI
app.get("/api/docs", Scalar({
  pageTitle: "API Documentation",
  sources: [
    { url: "/api/open-api", title: "API" },
    { url: "/api/auth/open-api/generate-schema", title: "Auth" },
  ],
}));

// ============== Stats Endpoints ==============

app.get("/api/stats", async (c) => {
	const boxes = await getBoxEntity(c).list();

	return c.json({
		success: true,
		stats: {
			totalBoxes: boxes.length,
			totalSadaqahs: boxes.reduce((sum, b) => sum + b.count, 0),
			totalValue: boxes.reduce((sum, b) => sum + b.totalValue, 0),
		},
	});
});

// Legacy counter endpoint
app.get("/api/count", async (c) => {
	const boxes = await getBoxEntity(c).list();
	return c.json({
		success: true,
		count: boxes.reduce((sum, b) => sum + b.count, 0),
	});
});

// ============== Health Check ==============

app.get("/api/health", (c) =>
	c.json(success({
		status: "ok",
		timestamp: new Date().toISOString(),
		requestId: c.get("requestId"),
	}))
);

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
