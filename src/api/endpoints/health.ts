/**
 * Health endpoints - Refactored
 */

import type { Context } from "hono";
import { healthRoute } from "./health.routes";
import { jsonSuccess } from "../shared/route-builder";
import type { RouteDefinition } from "../shared/route-builder";

export { healthRoute };

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
