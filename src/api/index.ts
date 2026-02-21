import { fromHono } from "chanfana";
import { Hono } from "hono";

// Middleware
import { errorHandler, requestLogger } from "./middleware";

// Entities
import { getBoxEntity } from "./entities/box";
import { successResponse } from "./lib/response";

// Import routes
import { createRoutes } from "./routes";

// Start a Hono app
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

// ============== Global Stats ==============
app.get("/api/stats", async (c) => {
	const boxEntity = getBoxEntity(c);
	const boxes = await boxEntity.list();

	const totalSadaqahs = boxes.reduce((sum, b) => sum + b.count, 0);
	const totalValue = boxes.reduce((sum, b) => sum + b.totalValue, 0);

	return c.json(
		successResponse({
			stats: {
				totalBoxes: boxes.length,
				totalSadaqahs,
				totalValue,
			},
		})
	);
});

// Legacy counter endpoint
app.get("/api/count", async (c) => {
	const boxEntity = getBoxEntity(c);
	const boxes = await boxEntity.list();
	const totalCount = boxes.reduce((sum, b) => sum + b.count, 0);
	return c.json(successResponse({ count: totalCount }));
});

// ============== Health Check ==============
app.get("/api/health", (c) =>
	c.json(
		successResponse({
			status: "ok",
			timestamp: new Date().toISOString(),
			requestId: c.get("requestId"),
		})
	)
);

// ============== SPA Fallback ==============
// Handle SPA routing - serve index.html for non-API, non-file routes
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
