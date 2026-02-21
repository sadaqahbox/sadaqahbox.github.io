import { fromHono } from "chanfana";
import { Hono } from "hono";

// Box endpoints
import { BoxList } from "./endpoints/boxes/list";
import { BoxCreate } from "./endpoints/boxes/create";
import { BoxGet } from "./endpoints/boxes/get";
import { BoxDelete } from "./endpoints/boxes/delete";
import { BoxEmpty } from "./endpoints/boxes/empty";
import { BoxCollections } from "./endpoints/boxes/collections";

// Sadaqah endpoints
import { SadaqahList } from "./endpoints/sadaqahs/list";
import { SadaqahAdd } from "./endpoints/sadaqahs/add";
import { SadaqahGet } from "./endpoints/sadaqahs/get";

// Entities
import { getBoxEntity } from "./entities/box";
import { successResponse, jsonError } from "./lib/response";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/api/docs",
});

// ============== Box Routes ==============
openapi.get("/api/boxes", BoxList);
openapi.post("/api/boxes", BoxCreate);
openapi.get("/api/boxes/:boxId", BoxGet);
openapi.delete("/api/boxes/:boxId", BoxDelete);
openapi.post("/api/boxes/:boxId/empty", BoxEmpty);
openapi.get("/api/boxes/:boxId/collections", BoxCollections);

// ============== Sadaqah Routes ==============
openapi.get("/api/boxes/:boxId/sadaqahs", SadaqahList);
openapi.post("/api/boxes/:boxId/sadaqahs", SadaqahAdd);
openapi.get("/api/boxes/:boxId/sadaqahs/:sadaqahId", SadaqahGet);

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
		})
	)
);

// ============== SPA Fallback ==============
// With html_handling: "fallback", Cloudflare serves static assets directly
// from the edge without invoking the Worker. This route only handles:
// 1. API 404s (already handled above)
// 2. SPA routing fallback (non-file paths get index.html)
app.get("/*", async (c) => {
	// If we got here, it's either:
	// - An API route that didn't match (return 404)
	// - A browser route that should serve index.html for SPA routing
	
	if (c.req.path.startsWith("/api/")) {
		return c.notFound();
	}

	// For SPA routes (no file extension), serve index.html
	// Static assets (JS, CSS, images) are already served directly by Cloudflare
	if (!c.req.path.includes(".")) {
		return c.env.ASSETS.fetch(new Request(`${new URL(c.req.url).origin}/index.html`));
	}

	return c.notFound();
});

export default app;
