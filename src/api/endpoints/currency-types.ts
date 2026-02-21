/**
 * Currency Type endpoints - Refactored
 *
 * Uses CRUD factory for standard operations.
 */

import { z } from "@hono/zod-openapi";
import { requireAuth, requireAdmin } from "../middleware";
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
		list: true,
		create: true,
		get: true,
		delete: true,
	},
});

export const currencyTypeRouteDefinitions: RouteDefinition[] = currencyTypeCrud.routes.map(r => {
	// Auth required for read operations (list, get)
	// Admin required for write operations (create, delete)
	const isWriteOperation = r.route.method === "post" || r.route.method === "delete";
	if (isWriteOperation) {
		return {
			...r,
			middleware: [requireAuth, requireAdmin],
		};
	}
	// Read operations require authentication
	return {
		...r,
		middleware: [requireAuth],
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
