/**
 * Currency endpoints - Refactored
 * 
 * Uses CRUD factory for standard operations.
 */

import { z } from "@hono/zod-openapi";
import { requireAuth } from "../middleware";
import { getCurrencyEntity } from "../entities";
import { CurrencySchema, CreateCurrencyBodySchema } from "../dtos";
import { createCrud } from "../shared/crud-factory";
import type { RouteDefinition } from "../shared/route-builder";
import type { CurrencyDto, CreateCurrencyBodyDto } from "../dtos";

const currencyCrud = createCrud<CurrencyDto, CreateCurrencyBodyDto>({
	resourceName: "Currency",
	tagName: "Currencies",
	path: "/api/currencies",
	idParam: "currencyId",
	itemsKey: "currencies", // Proper pluralization
	schemas: {
		item: CurrencySchema,
		create: CreateCurrencyBodySchema,
	},
	getEntity: getCurrencyEntity,
	getCreateInput: (body) => body as CreateCurrencyBodyDto,
	checkDuplicate: { field: "code", method: "getByCode" },
	auth: {
		list: false, // Public
		create: true,
		get: false, // Public
		delete: true,
	},
});

export const currencyRouteDefinitions: RouteDefinition[] = currencyCrud.routes.map(r => {
	// Only require auth for create and delete
	const needsAuth = r.route.method === "post" || r.route.method === "delete";
	return {
		...r,
		middleware: needsAuth ? [requireAuth] : undefined,
	};
});

// Re-export for direct use if needed
export const {
	listRoute,
	createRoute,
	getRoute,
	deleteRoute,
	listHandler,
	createHandler,
	getHandler,
	deleteHandler,
} = currencyCrud;
