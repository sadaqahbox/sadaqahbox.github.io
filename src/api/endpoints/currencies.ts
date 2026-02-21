/**
 * Currency endpoints
 */

import type { Context } from "hono";
import { CurrencySchema, CreateCurrencyBodySchema } from "../domain/schemas";
import { getCurrencyEntity } from "../entities";
import { requireAuth, requireAdmin } from "../middleware";
import { createCrud } from "../shared/crud-factory";
import type { RouteDefinition } from "../shared/route-builder";
import type { Currency, CreateCurrencyOptions } from "../domain/types";

// ============== CRUD Routes (Factory Generated) ==============

const crud = createCrud<Currency, CreateCurrencyOptions, unknown>({
    resourceName: "Currency",
    tagName: "Currencies",
    path: "/api/currencies",
    idParam: "currencyId",
    itemsKey: "currencies",  // Proper pluralization
    schemas: {
        item: CurrencySchema,
        create: CreateCurrencyBodySchema,
    },
    getEntity: getCurrencyEntity,
    getCreateInput: (body, _c) => ({
        code: String(body.code),
        name: String(body.name),
        symbol: body.symbol ? String(body.symbol) : undefined,
        currencyTypeId: body.currencyTypeId ? String(body.currencyTypeId) : undefined,
    }),
    checkDuplicate: {
        field: "code",
        method: "getByCode",
    },
    auth: {
        list: false,
        create: true,
        get: false,
        delete: true,
    },
});

// Export all routes and handlers
export const {
    listRoute,
    createRoute,
    getRoute,
    deleteRoute,
    listHandler,
    createHandler,
    getHandler,
    deleteHandler,
} = crud;

// ============== Combined Route Definitions ==============

export const currencyRouteDefinitions: RouteDefinition[] = [
    // Public routes
    { route: listRoute, handler: listHandler },
    { route: getRoute, handler: getHandler },
    // Admin routes
    { route: createRoute, handler: createHandler, middleware: [requireAuth, requireAdmin] },
    { route: deleteRoute, handler: deleteHandler, middleware: [requireAuth, requireAdmin] },
];
