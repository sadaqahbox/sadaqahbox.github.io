/**
 * Main API Application
 * 
 * Sets up the Hono app with OpenAPI documentation,
 * middleware, and route registration.
 */

import { fromHono } from "chanfana";
import { Hono } from "hono";
import { errorHandler, requestLogger } from "./middleware";
import { getBoxEntity } from "./entities";
import { success } from "./shared/response";
import { createRoutes } from "./routes";

// Initialize Hono app
const app = new Hono<{ Bindings: Env }>();

// Apply global middleware
app.use("*", requestLogger);
app.use("*", errorHandler);

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/api/docs",
});

// Register all routes
createRoutes(openapi);

// ============== Stats Endpoints ==============

app.get("/api/stats", async (c) => {
	const boxes = await getBoxEntity(c).list();

	return c.json(success({
		stats: {
			totalBoxes: boxes.length,
			totalSadaqahs: boxes.reduce((sum, b) => sum + b.count, 0),
			totalValue: boxes.reduce((sum, b) => sum + b.totalValue, 0),
		},
	}));
});

// Legacy counter endpoint
app.get("/api/count", async (c) => {
	const boxes = await getBoxEntity(c).list();
	return c.json(success({
		count: boxes.reduce((sum, b) => sum + b.count, 0),
	}));
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
	if (path.startsWith("/api/") || path === "/openapi.json") {
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
