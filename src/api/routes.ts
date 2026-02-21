/**
 * API Routes
 * 
 * All route registrations are centralized here.
 * Endpoints are grouped by resource for better organization.
 */

import type { OpenAPIHono } from "@hono/zod-openapi";
import { registerRoutes as registerRouteGroup } from "./shared/route-builder";

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
	// ============== Box Routes ==============
	registerRouteGroup(app, [
		{ route: boxListRoute, handler: boxListHandler },
		{ route: boxCreateRoute, handler: boxCreateHandler },
		{ route: boxGetRoute, handler: boxGetHandler },
		{ route: boxUpdateRoute, handler: boxUpdateHandler },
		{ route: boxDeleteRoute, handler: boxDeleteHandler },
		{ route: emptyRoute, handler: emptyHandler },
		{ route: collectionsRoute, handler: collectionsHandler },
		{ route: addTagRoute, handler: addTagHandler },
		{ route: removeTagRoute, handler: removeTagHandler },
		{ route: setTagsRoute, handler: setTagsHandler },
	]);

	// ============== Sadaqah Routes ==============
	registerRouteGroup(app, [
		{ route: sadaqahListRoute, handler: sadaqahListHandler },
		{ route: sadaqahAddRoute, handler: sadaqahAddHandler },
		{ route: sadaqahGetRoute, handler: sadaqahGetHandler },
		{ route: sadaqahDeleteRoute, handler: sadaqahDeleteHandler },
	]);

	// ============== Currency Type Routes ==============
	registerRouteGroup(app, [
		{ route: currencyTypeListRoute, handler: currencyTypeListHandler },
		{ route: currencyTypeCreateRoute, handler: currencyTypeCreateHandler },
		{ route: currencyTypeGetRoute, handler: currencyTypeGetHandler },
		{ route: currencyTypeDeleteRoute, handler: currencyTypeDeleteHandler },
		{ route: currencyTypeInitializeRoute, handler: currencyTypeInitializeHandler },
	]);

	// ============== Currency Routes ==============
	registerRouteGroup(app, [
		{ route: currencyListRoute, handler: currencyListHandler },
		{ route: currencyCreateRoute, handler: currencyCreateHandler },
		{ route: currencyGetRoute, handler: currencyGetHandler },
		{ route: currencyDeleteRoute, handler: currencyDeleteHandler },
	]);

	// ============== Tag Routes ==============
	registerRouteGroup(app, [
		{ route: tagListRoute, handler: tagListHandler },
		{ route: tagCreateRoute, handler: tagCreateHandler },
		{ route: tagGetRoute, handler: tagGetHandler },
		{ route: tagDeleteRoute, handler: tagDeleteHandler },
		{ route: tagBoxesRoute, handler: tagBoxesHandler },
	]);
}
