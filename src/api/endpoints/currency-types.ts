/**
 * Currency Type endpoints - Refactored
 * 
 * Uses CRUD factory for standard operations.
 */

import { z } from "@hono/zod-openapi";
import { requireAuth } from "../middleware";
import { getCurrencyTypeEntity } from "../entities";
import { CurrencyTypeSchema, CreateCurrencyTypeBodySchema } from "../dtos";
import { createCrud } from "../shared/crud-factory";
import type { RouteDefinition } from "../shared/route-builder";
import type { CurrencyTypeDto, CreateCurrencyTypeBodyDto } from "../dtos";

const currencyTypeCrud = createCrud<CurrencyTypeDto, CreateCurrencyTypeBodyDto>({
	resourceName: "CurrencyType",
	tagName: "Currency Types",
	path: "/api/currency-types",
	idParam: "currencyTypeId",
	itemsKey: "currencyTypes", // Proper camelCase
	schemas: {
		item: CurrencyTypeSchema,
		create: CreateCurrencyTypeBodySchema,
	},
	getEntity: getCurrencyTypeEntity,
	getCreateInput: (body) => body as CreateCurrencyTypeBodyDto,
	checkDuplicate: { field: "name", method: "getByName" },
	auth: {
		list: false, // Public
		create: true,
		get: false, // Public
		delete: true,
	},
});

export const currencyTypeRouteDefinitions: RouteDefinition[] = currencyTypeCrud.routes.map(r => {
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
} = currencyTypeCrud;
