/**
 * Currency Type endpoints
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { CurrencyTypeSchema, CreateCurrencyTypeBodySchema } from "../domain/schemas";
import { getCurrencyTypeEntity } from "../entities";
import { requireAuth, requireAdmin } from "../middleware";
import { success } from "../shared/response";
import {
    buildRoute,
    create200Response,
    type RouteDefinition,
} from "../shared/route-builder";
import { createCrud } from "../shared/crud-factory";
import type { CurrencyType, CreateCurrencyTypeOptions } from "../domain/types";

// ============== CRUD Routes (Factory Generated) ==============

const crud = createCrud<CurrencyType, CreateCurrencyTypeOptions, unknown>({
    resourceName: "CurrencyType",
    tagName: "Currency Types",
    path: "/api/currency-types",
    idParam: "currencyTypeId",
    schemas: {
        item: CurrencyTypeSchema,
        create: CreateCurrencyTypeBodySchema,
    },
    getEntity: getCurrencyTypeEntity,
    getCreateInput: (body, _c) => ({
        name: String(body.name),
        description: body.description ? String(body.description) : undefined,
    }),
    checkDuplicate: true,
    auth: {
        list: false,
        create: true,
        get: false,
        delete: true,
    },
});

// Export CRUD routes
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

// ============== Custom Route: Initialize Defaults ==============

const InitializeResponseSchema = z.object({
    success: z.boolean(),
    currencyTypes: CurrencyTypeSchema.array(),
    message: z.string(),
});

export const initializeRoute = buildRoute({
    method: "post",
    path: "/api/currency-types/initialize",
    tags: ["Currency Types"],
    summary: "Initialize default currency types (Fiat, Crypto, Commodity)",
    responses: create200Response(InitializeResponseSchema, "Default currency types initialized"),
    requireAuth: true,
});

export const initializeHandler = async (c: Context<{ Bindings: Env }>) => {
    const currencyTypes = await getCurrencyTypeEntity(c).initializeDefaults();
    return c.json(success({
        currencyTypes,
        message: "Default currency types initialized successfully",
    }));
};

// ============== Combined Route Definitions ==============

export const currencyTypeRouteDefinitions: RouteDefinition[] = [
    // Public routes
    { route: listRoute, handler: listHandler },
    { route: getRoute, handler: getHandler },
    // Admin routes
    { route: createRoute, handler: createHandler, middleware: [requireAuth, requireAdmin] },
    { route: deleteRoute, handler: deleteHandler, middleware: [requireAuth, requireAdmin] },
    { route: initializeRoute, handler: initializeHandler, middleware: [requireAuth, requireAdmin] },
];
