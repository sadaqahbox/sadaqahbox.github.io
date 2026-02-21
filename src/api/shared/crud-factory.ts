/**
 * CRUD Factory
 * 
 * Generates standard CRUD routes and handlers for simple resources.
 * Reduces boilerplate for entities with standard list/create/get/delete operations.
 */

import { z } from "@hono/zod-openapi";
import type { ZodType } from "zod";
import type { Context } from "hono";
import { success, notFound, conflict } from "./response";
import {
    buildRoute,
    getParams,
    getQuery,
    getBody,
    jsonSuccess,
    createIdParamSchema,
    createPaginatedResponse,
    create200Response,
    create201Response,
    create404Response,
    create409Response,
    type RouteDefinition,
} from "./route-builder";
import { createItemResponseSchema } from "../domain/schemas";

// ============== Types ==============

export interface CrudEntity<T, CreateInput, EntityContext> {
    list(): Promise<T[]>;
    create(data: CreateInput): Promise<T>;
    get(id: string): Promise<T | null>;
    update?(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    getByName?(name: string): Promise<T | null>;
    getByCode?(code: string): Promise<T | null>;
}

export interface CrudConfig<T, CreateInput, EntityContext> {
    /** Resource name (e.g., "Tag", "Currency") */
    resourceName: string;
    /** OpenAPI tag name (defaults to resourceName + "s" with proper pluralization) */
    tagName?: string;
    /** API path prefix (e.g., "/api/tags") */
    path: string;
    /** URL parameter name for ID (e.g., "tagId") */
    idParam: string;
    /** Parent resource parameter (for nested routes like /api/boxes/{boxId}/sadaqahs) */
    parentIdParam?: string;
    /** Zod schemas */
    schemas: {
        item: ZodType;
        create: ZodType;
        update?: ZodType;
    };
    /** Function to get entity instance from context */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getEntity: (c: Context<{ Bindings: Env }>) => any;
    /** Function to extract create input from request body (can use context for user info) */
    getCreateInput: (body: Record<string, unknown>, c: Context<{ Bindings: Env }>) => CreateInput | Promise<CreateInput>;
    /** Check for duplicates on create */
    checkDuplicate?: boolean | {
        field: string;
        method: string;
    };
    /** Auth requirements per action */
    auth?: {
        list?: boolean;
        create?: boolean;
        get?: boolean;
        update?: boolean;
        delete?: boolean;
    };
    /** Include update (PATCH) endpoint */
    includeUpdate?: boolean;
    /** Query schema for list endpoint */
    listQuery?: ZodType;
    /** Custom items key for list response (e.g., "currencies" instead of auto-generated "currencys") */
    itemsKey?: string;
    /** Custom list handler logic (transform items before response) */
    transformList?: (items: T[], query: Record<string, unknown>, c: Context<{ Bindings: Env }>) => { items: T[]; [key: string]: unknown };
    /** Custom handlers to override defaults */
    overrides?: {
        list?: (c: Context<{ Bindings: Env }>) => Promise<Response>;
        create?: (c: Context<{ Bindings: Env }>) => Promise<Response>;
        get?: (c: Context<{ Bindings: Env }>) => Promise<Response>;
        update?: (c: Context<{ Bindings: Env }>) => Promise<Response>;
        delete?: (c: Context<{ Bindings: Env }>) => Promise<Response>;
    };
    /** Build custom routes - receives base path and idParam */
    buildCustomRoutes?: (basePath: string, idParam: string) => RouteDefinition[];
}

// ============== Factory Function ==============

export function createCrud<T, CreateInput = Record<string, unknown>, EntityContext = unknown>(
    config: CrudConfig<T, CreateInput, EntityContext>
) {
    const { resourceName, path, idParam, schemas, getEntity, getCreateInput } = config;
    const auth = config.auth ?? {};
    const overrides = config.overrides ?? {};
    const tagName = config.tagName ?? resourceName + "s";

    const IdParamSchema = createIdParamSchema(idParam);
    const itemKey = resourceName.toLowerCase().replace(/\s+/g, "");
    // Support custom itemsKey for proper pluralization (e.g., "currencies" not "currencys")
    const itemsKey = config.itemsKey ?? itemKey + "s";
    const ListResponseSchema = createPaginatedResponse(schemas.item, itemsKey);
    const ItemResponseSchema = createItemResponseSchema(schemas.item, itemKey);
    const DeleteResponseSchema = createItemResponseSchema(z.object({ deleted: z.boolean() }), "data");

    // ============== Routes ==============

    const listRoute = buildRoute({
        method: "get",
        path,
        tags: [tagName],
        summary: `List all ${resourceName.toLowerCase()}s`,
        ...(config.listQuery ? { query: config.listQuery } : {}),
        responses: create200Response(ListResponseSchema, `Returns all ${resourceName.toLowerCase()}s`),
        requireAuth: auth.list,
    });

    const createRoute = buildRoute({
        method: "post",
        path,
        tags: [tagName],
        summary: `Create a new ${resourceName.toLowerCase()}`,
        body: schemas.create,
        responses: {
            ...create201Response(ItemResponseSchema, `Returns the created ${resourceName.toLowerCase()}`),
            ...(config.checkDuplicate ? create409Response(`${resourceName} already exists`) : {}),
        },
        requireAuth: auth.create ?? true,
    });

    const getRoute = buildRoute({
        method: "get",
        path: `${path}/{${idParam}}`,
        tags: [tagName],
        summary: `Get a ${resourceName.toLowerCase()}`,
        params: IdParamSchema,
        responses: {
            ...create200Response(ItemResponseSchema, `Returns the ${resourceName.toLowerCase()}`),
            ...create404Response(`${resourceName} not found`),
        },
        requireAuth: auth.get,
    });

    const updateRoute = config.includeUpdate && schemas.update
        ? buildRoute({
            method: "patch",
            path: `${path}/{${idParam}}`,
            tags: [resourceName + "s"],
            summary: `Update a ${resourceName.toLowerCase()}`,
            params: IdParamSchema,
            body: schemas.update,
            responses: {
                ...create200Response(ItemResponseSchema, `Returns the updated ${resourceName.toLowerCase()}`),
                ...create404Response(`${resourceName} not found`),
            },
            requireAuth: auth.update ?? true,
        })
        : null;

    const deleteRoute = buildRoute({
        method: "delete",
        path: `${path}/{${idParam}}`,
        tags: [tagName],
        summary: `Delete a ${resourceName.toLowerCase()}`,
        params: IdParamSchema,
        responses: {
            ...create200Response(DeleteResponseSchema, `${resourceName} deleted`),
            ...create404Response(`${resourceName} not found`),
        },
        requireAuth: auth.delete ?? true,
    });

    // ============== Handlers ==============

    const listHandler = overrides.list ?? (async (c: Context<{ Bindings: Env }>) => {
        let items = await getEntity(c).list();
        
        // Apply query parsing if schema provided
        let query: Record<string, unknown> = {};
        if (config.listQuery) {
            query = getQuery<Record<string, unknown>>(c);
        }

        // Transform if custom transform provided
        if (config.transformList) {
            const result = config.transformList(items, query, c);
            return c.json(success(result));
        }

        return c.json(success({
            [itemsKey]: items,
            total: items.length,
        }));
    });

    const createHandler = overrides.create ?? (async (c: Context<{ Bindings: Env }>) => {
        const body = getBody<Record<string, unknown>>(c);
        const input = await getCreateInput(body, c);
        const entity = getEntity(c);

        // Check for duplicates if enabled
        if (config.checkDuplicate) {
            const checkConfig = typeof config.checkDuplicate === "boolean"
                ? { field: "name", method: "getByName" as const }
                : config.checkDuplicate;

            const value = (body[checkConfig.field] as string)?.trim();
            const checkMethod = entity[checkConfig.method];

            if (value && typeof checkMethod === "function") {
                const existing = await (checkMethod as (value: string) => Promise<T | null>)(value);
                if (existing) {
                    return conflict(`${resourceName} with this ${checkConfig.field} already exists`);
                }
            }
        }

        const item = await entity.create(input as CreateInput);
        return jsonSuccess(c, { [resourceName.toLowerCase()]: item }, 201);
    });

    const getHandler = overrides.get ?? (async (c: Context<{ Bindings: Env }>) => {
        const { [idParam]: id } = getParams<Record<string, string>>(c);
        const item = await getEntity(c).get(id);

        if (!item) {
            return notFound(resourceName, id);
        }

        return c.json(success({ [resourceName.toLowerCase()]: item }));
    });

    const updateHandler = overrides.update ?? (async (c: Context<{ Bindings: Env }>) => {
        const { [idParam]: id } = getParams<Record<string, string>>(c);
        const body = getBody<Record<string, unknown>>(c);
        const entity = getEntity(c);

        if (!entity.update) {
            return notFound(resourceName, id);
        }

        const item = await entity.update(id, body);

        if (!item) {
            return notFound(resourceName, id);
        }

        return c.json(success({ [resourceName.toLowerCase()]: item }));
    });

    const deleteHandler = overrides.delete ?? (async (c: Context<{ Bindings: Env }>) => {
        const { [idParam]: id } = getParams<Record<string, string>>(c);
        const deleted = await getEntity(c).delete(id);

        if (!deleted) {
            return notFound(resourceName, id);
        }

        return c.json(success({ deleted: true }));
    });

    // ============== Route Definitions ==============

    const routes: RouteDefinition[] = [
        { route: listRoute, handler: listHandler, middleware: auth.list ? [requireAuth] : undefined },
        { route: createRoute, handler: createHandler, middleware: auth.create !== false ? [requireAuth] : undefined },
        { route: getRoute, handler: getHandler, middleware: auth.get ? [requireAuth] : undefined },
        ...(updateRoute ? [{ route: updateRoute, handler: updateHandler, middleware: auth.update !== false ? [requireAuth] : undefined }] : []),
        { route: deleteRoute, handler: deleteHandler, middleware: auth.delete !== false ? [requireAuth] : undefined },
        ...(config.buildCustomRoutes ? config.buildCustomRoutes(path, idParam) : []),
    ];

    return {
        routes,
        handlers: { list: listHandler, create: createHandler, get: getHandler, update: updateHandler, delete: deleteHandler },
        // Export individual routes/handlers for custom overrides
        listRoute,
        createRoute,
        getRoute,
        updateRoute,
        deleteRoute,
        listHandler,
        createHandler,
        getHandler,
        updateHandler,
        deleteHandler,
    };
}

// Need to import this here to avoid circular dependency issues
import { requireAuth } from "../middleware";
