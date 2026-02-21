/**
 * Health endpoints - Refactored
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import {
	buildRoute,
	create200Response,
	type RouteDefinition,
} from "../shared/route-builder";
import { HealthResponseSchema } from "../dtos";
import { jsonSuccess } from "../shared/route-builder";

export const healthRoute = buildRoute({
	method: "get",
	path: "/api/health",
	tags: ["System"],
	summary: "Health check",
	responses: create200Response(HealthResponseSchema, "API health status"),
	requireAuth: false,
});

export const healthHandler = async (c: Context<{ Bindings: Env }>) => {
	return jsonSuccess(c, {
		status: "healthy" as const,
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
};

// Export as route definition array for consistency
export const healthRouteDefinitions: RouteDefinition[] = [
	{ route: healthRoute, handler: healthHandler },
];
