/**
 * API Routes
 * 
 * All route registrations are centralized here.
 * Endpoints are grouped by resource for better organization.
 */

import type { OpenAPIHono } from "@hono/zod-openapi";
import { registerRoutes as registerRouteGroup } from "./shared/route-builder";
import { requireAuth, requireAdmin } from "./middleware";

// System endpoints
import { healthRoute, healthHandler } from "./endpoints/health";
import { statsRouteDefinitions } from "./endpoints/stats";

// Box endpoints
import {
	listRoute as boxListRoute,
	listHandler as boxListHandler,
	createRoute as boxCreateRoute,
	createHandler as boxCreateHandler,
	getRoute as boxGetRoute,
	getHandler as boxGetHandler,
	updateRoute as boxUpdateRoute,
	updateHandler as boxUpdateHandler,
	deleteRoute as boxDeleteRoute,
	deleteHandler as boxDeleteHandler,
	emptyRoute,
	emptyHandler,
	collectionsRoute,
	collectionsHandler,
	addTagRoute,
	addTagHandler,
	removeTagRoute,
	removeTagHandler,
	setTagsRoute,
	setTagsHandler,
} from "./endpoints/boxes";

// Sadaqah endpoints
import {
	listRoute as sadaqahListRoute,
	listHandler as sadaqahListHandler,
	addRoute as sadaqahAddRoute,
	addHandler as sadaqahAddHandler,
	getRoute as sadaqahGetRoute,
	getHandler as sadaqahGetHandler,
	deleteRoute as sadaqahDeleteRoute,
	deleteHandler as sadaqahDeleteHandler,
} from "./endpoints/sadaqahs";

// Currency endpoints
import {
	listRoute as currencyListRoute,
	listHandler as currencyListHandler,
	createRoute as currencyCreateRoute,
	createHandler as currencyCreateHandler,
	getRoute as currencyGetRoute,
	getHandler as currencyGetHandler,
	deleteRoute as currencyDeleteRoute,
	deleteHandler as currencyDeleteHandler,
} from "./endpoints/currencies";

// Currency Type endpoints
import {
	listRoute as currencyTypeListRoute,
	listHandler as currencyTypeListHandler,
	createRoute as currencyTypeCreateRoute,
	createHandler as currencyTypeCreateHandler,
	getRoute as currencyTypeGetRoute,
	getHandler as currencyTypeGetHandler,
	deleteRoute as currencyTypeDeleteRoute,
	deleteHandler as currencyTypeDeleteHandler,
	initializeRoute as currencyTypeInitializeRoute,
	initializeHandler as currencyTypeInitializeHandler,
} from "./endpoints/currency-types";

// Tag endpoints
import {
	listRoute as tagListRoute,
	listHandler as tagListHandler,
	createRoute as tagCreateRoute,
	createHandler as tagCreateHandler,
	getRoute as tagGetRoute,
	getHandler as tagGetHandler,
	deleteRoute as tagDeleteRoute,
	deleteHandler as tagDeleteHandler,
	boxesRoute as tagBoxesRoute,
	boxesHandler as tagBoxesHandler,
} from "./endpoints/tags";

/**
 * Registers all API routes with the OpenAPIHono app
 */
export function registerRoutes(app: OpenAPIHono<{ Bindings: Env }>): void {
	// ============== System Routes ==============
	registerRouteGroup(app, [
		{ route: healthRoute, handler: healthHandler },
	]);

	// ============== Stats Routes ==============
	registerRouteGroup(app, statsRouteDefinitions);

	// ============== Box Routes ==============
	registerRouteGroup(app, [
		{ route: boxListRoute, handler: boxListHandler, middleware: [requireAuth] },
		{ route: boxCreateRoute, handler: boxCreateHandler, middleware: [requireAuth] },
		{ route: boxGetRoute, handler: boxGetHandler, middleware: [requireAuth] },
		{ route: boxUpdateRoute, handler: boxUpdateHandler, middleware: [requireAuth] },
		{ route: boxDeleteRoute, handler: boxDeleteHandler, middleware: [requireAuth] },
		{ route: emptyRoute, handler: emptyHandler, middleware: [requireAuth] },
		{ route: collectionsRoute, handler: collectionsHandler, middleware: [requireAuth] },
		{ route: addTagRoute, handler: addTagHandler, middleware: [requireAuth] },
		{ route: removeTagRoute, handler: removeTagHandler, middleware: [requireAuth] },
		{ route: setTagsRoute, handler: setTagsHandler, middleware: [requireAuth] },
	]);

	// ============== Sadaqah Routes ==============
	registerRouteGroup(app, [
		{ route: sadaqahListRoute, handler: sadaqahListHandler, middleware: [requireAuth] },
		{ route: sadaqahAddRoute, handler: sadaqahAddHandler, middleware: [requireAuth] },
		{ route: sadaqahGetRoute, handler: sadaqahGetHandler, middleware: [requireAuth] },
		{ route: sadaqahDeleteRoute, handler: sadaqahDeleteHandler, middleware: [requireAuth] },
	]);

	// ============== Currency Type Routes ==============
	// List and Get are public, Create/Delete/Initialize require admin
	registerRouteGroup(app, [
		{ route: currencyTypeListRoute, handler: currencyTypeListHandler },
		{ route: currencyTypeGetRoute, handler: currencyTypeGetHandler },
	]);
	registerRouteGroup(app, [
		{ route: currencyTypeCreateRoute, handler: currencyTypeCreateHandler, middleware: [requireAuth, requireAdmin] },
		{ route: currencyTypeDeleteRoute, handler: currencyTypeDeleteHandler, middleware: [requireAuth, requireAdmin] },
		{ route: currencyTypeInitializeRoute, handler: currencyTypeInitializeHandler, middleware: [requireAuth, requireAdmin] },
	]);

	// ============== Currency Routes ==============
	// List and Get are public, Create/Delete require admin
	registerRouteGroup(app, [
		{ route: currencyListRoute, handler: currencyListHandler },
		{ route: currencyGetRoute, handler: currencyGetHandler },
	]);
	registerRouteGroup(app, [
		{ route: currencyCreateRoute, handler: currencyCreateHandler, middleware: [requireAuth, requireAdmin] },
		{ route: currencyDeleteRoute, handler: currencyDeleteHandler, middleware: [requireAuth, requireAdmin] },
	]);

	// ============== Tag Routes ==============
	// List, Get, and GetBoxes are public, Create/Delete require admin
	registerRouteGroup(app, [
		{ route: tagListRoute, handler: tagListHandler },
		{ route: tagGetRoute, handler: tagGetHandler },
		{ route: tagBoxesRoute, handler: tagBoxesHandler },
	]);
	registerRouteGroup(app, [
		{ route: tagCreateRoute, handler: tagCreateHandler, middleware: [requireAuth, requireAdmin] },
		{ route: tagDeleteRoute, handler: tagDeleteHandler, middleware: [requireAuth, requireAdmin] },
	]);
}

// Re-export for convenience
export { healthRoute, healthHandler } from "./endpoints/health";
export { statsRouteDefinitions } from "./endpoints/stats";
