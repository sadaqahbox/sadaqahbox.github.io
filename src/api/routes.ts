/**
 * API Routes
 *
 * All route registrations are centralized here.
 * Endpoints are grouped by resource for better organization.
 */

import type { OpenAPIHono } from "@hono/zod-openapi";
import { registerRoutes as registerRouteGroup, type RouteDefinition } from "./shared/route-builder";

// System endpoints
import { healthRoute, healthHandler } from "./endpoints/health";
import { statsRouteDefinitions } from "./endpoints/stats";

// Box endpoints (CRUD factory generated + custom)
import { boxRouteDefinitions } from "./endpoints/boxes";

// Sadaqah endpoints (CRUD factory generated + custom)
import { sadaqahRouteDefinitions } from "./endpoints/sadaqahs";

// Currency endpoints (CRUD factory generated)
import { currencyRouteDefinitions } from "./endpoints/currencies";

// Currency Type endpoints (CRUD factory generated)
import { currencyTypeRouteDefinitions } from "./endpoints/currency-types";

// Tag endpoints (CRUD factory generated)
import { tagRouteDefinitions } from "./endpoints/tags";

/**
 * All route definitions for the API
 */
export const allRouteDefinitions: RouteDefinition[] = [
	// System routes
	{ route: healthRoute, handler: healthHandler },
	// Resource routes
	...statsRouteDefinitions,
	...boxRouteDefinitions,
	...sadaqahRouteDefinitions,
	...currencyTypeRouteDefinitions,
	...currencyRouteDefinitions,
	...tagRouteDefinitions,
];

/**
 * Registers all API routes with the OpenAPIHono app
 */
export function registerRoutes(app: OpenAPIHono<{ Bindings: Env }>): void {
	registerRouteGroup(app, allRouteDefinitions);
}

// Re-export for convenience
export { healthRoute, healthHandler } from "./endpoints/health";
export { statsRouteDefinitions } from "./endpoints/stats";
export { boxRouteDefinitions } from "./endpoints/boxes";
export { sadaqahRouteDefinitions } from "./endpoints/sadaqahs";
