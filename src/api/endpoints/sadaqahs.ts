/**
 * Sadaqah endpoints
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { 
    SadaqahSchema, 
    AddSadaqahBodySchema, 
    BoxSchema,
    createItemResponseSchema,
} from "../domain/schemas";
import { getSadaqahEntity, getBoxEntity, getCurrencyEntity } from "../entities";
import { getCurrentUser, requireAuth } from "../middleware";
import { success, notFound, validationError } from "../shared/response";
import {
    buildRoute,
    getParams,
    getQuery,
    getBody,
    createIdParamSchema,
    createPaginatedResponse,
    PaginationQuerySchema,
    create200Response,
    create400Response,
    create404Response,
    type RouteDefinition,
} from "../shared/route-builder";
import { DEFAULT_CURRENCY_CODE, MAX_SADAQAH_AMOUNT } from "../domain/constants";

// ============== Schemas ==============

const SadaqahParamsSchema = z.object({
    boxId: z.string(),
    sadaqahId: z.string(),
});

const BoxCoreSchema = BoxSchema.pick({
    id: true,
    name: true,
    count: true,
    totalValue: true,
}).extend({
    currency: z.any().nullable(),
});

const ListQuerySchema = PaginationQuerySchema.extend({
    from: z.string().optional(),
    to: z.string().optional(),
});

// ============== Routes ==============

// List Sadaqahs
const ListResponseSchema = createPaginatedResponse(SadaqahSchema, "sadaqahs").extend({
    summary: z.object({
        totalSadaqahs: z.number(),
        totalValue: z.number(),
        currency: z.any(),
    }),
});

export const listRoute = buildRoute({
    method: "get",
    path: "/api/boxes/{boxId}/sadaqahs",
    tags: ["Sadaqahs"],
    summary: "List sadaqahs in a box",
    params: createIdParamSchema("boxId"),
    query: ListQuerySchema,
    responses: {
        ...create200Response(ListResponseSchema, "Returns sadaqahs"),
        ...create404Response("Box not found"),
    },
    requireAuth: true,
});

export const listHandler = async (c: Context<{ Bindings: Env }>) => {
    const user = getCurrentUser(c);
    const { boxId } = getParams<{ boxId: string }>(c);
    const { page, limit, from, to } = getQuery<{ page: number; limit: number; from?: string; to?: string }>(c);

    const box = await getBoxEntity(c).get(boxId, user.id);
    if (!box) {
        return notFound("Box", boxId);
    }

    const result = await getSadaqahEntity(c).list(boxId, { page, limit, from, to }, user.id);
    return c.json(success({
        sadaqahs: result.sadaqahs,
        total: result.total,
        summary: result.summary,
    }));
};

// Add Sadaqah
const AddResponseSchema = z.object({
    success: z.boolean(),
    sadaqahs: SadaqahSchema.array(),
    box: BoxCoreSchema,
    message: z.string(),
});

export const addRoute = buildRoute({
    method: "post",
    path: "/api/boxes/{boxId}/sadaqahs",
    tags: ["Sadaqahs"],
    summary: "Add sadaqah(s) to a box",
    params: createIdParamSchema("boxId"),
    body: AddSadaqahBodySchema,
    responses: {
        ...create200Response(AddResponseSchema, "Returns created sadaqahs and updated box"),
        ...create400Response("Invalid input"),
        ...create404Response("Box not found"),
    },
    requireAuth: true,
});

export const addHandler = async (c: Context<{ Bindings: Env }>) => {
    const user = getCurrentUser(c);
    const { boxId } = getParams<{ boxId: string }>(c);
    const { amount, value, currencyCode, metadata } = getBody<{
        amount?: number;
        value?: number;
        currencyCode?: string;
        metadata?: Record<string, string>;
    }>(c);

    const box = await getBoxEntity(c).get(boxId, user.id);
    if (!box) {
        return notFound("Box", boxId);
    }

    const sadaqahAmount = amount !== undefined 
        ? Math.min(Math.max(1, amount), MAX_SADAQAH_AMOUNT)
        : undefined;

    const currency = await getCurrencyEntity(c).getOrCreate({
        code: (currencyCode || DEFAULT_CURRENCY_CODE).toUpperCase(),
    });

    const result = await getSadaqahEntity(c).addMultiple({
        boxId,
        amount: sadaqahAmount,
        value,
        currencyId: currency.id,
        userId: user.id,
        metadata,
    });

    if (!result) {
        return validationError("Failed to add sadaqahs");
    }

    const sadaqahCount = result.sadaqahs.length;
    const sadaqahCurrencyCode = currencyCode || DEFAULT_CURRENCY_CODE;

    return c.json(success({
        sadaqahs: result.sadaqahs,
        box: {
            id: result.box.id,
            name: result.box.name,
            count: result.box.count,
            totalValue: result.box.totalValue,
            currency,
        },
        message: `Added ${sadaqahCount} sadaqah${sadaqahCount > 1 ? "s" : ""} (${value || 1} ${sadaqahCurrencyCode}) to "${box.name}"`,
    }));
};

// Get Sadaqah
const GetResponseSchema = createItemResponseSchema(SadaqahSchema, "sadaqah");

export const getRoute = buildRoute({
    method: "get",
    path: "/api/boxes/{boxId}/sadaqahs/{sadaqahId}",
    tags: ["Sadaqahs"],
    summary: "Get a specific sadaqah",
    params: SadaqahParamsSchema,
    responses: {
        ...create200Response(GetResponseSchema, "Returns the sadaqah"),
        ...create404Response("Sadaqah not found"),
    },
    requireAuth: true,
});

export const getHandler = async (c: Context<{ Bindings: Env }>) => {
    const user = getCurrentUser(c);
    const { boxId, sadaqahId } = getParams<{ boxId: string; sadaqahId: string }>(c);

    const box = await getBoxEntity(c).get(boxId, user.id);
    if (!box) {
        return notFound("Box", boxId);
    }

    const sadaqah = await getSadaqahEntity(c).get(boxId, sadaqahId);
    if (!sadaqah) {
        return notFound("Sadaqah", sadaqahId);
    }

    return c.json(success({ sadaqah }));
};

// Delete Sadaqah
const DeleteResponseSchema = createItemResponseSchema(z.object({ deleted: z.boolean() }), "data");

export const deleteRoute = buildRoute({
    method: "delete",
    path: "/api/boxes/{boxId}/sadaqahs/{sadaqahId}",
    tags: ["Sadaqahs"],
    summary: "Delete a sadaqah",
    params: SadaqahParamsSchema,
    responses: {
        ...create200Response(DeleteResponseSchema, "Sadaqah deleted"),
        ...create404Response("Sadaqah not found"),
    },
    requireAuth: true,
});

export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
    const user = getCurrentUser(c);
    const { boxId, sadaqahId } = getParams<{ boxId: string; sadaqahId: string }>(c);

    const box = await getBoxEntity(c).get(boxId, user.id);
    if (!box) {
        return notFound("Box", boxId);
    }

    const deleted = await getSadaqahEntity(c).delete(boxId, sadaqahId, user.id);
    if (!deleted) {
        return notFound("Sadaqah", sadaqahId);
    }

    return c.json(success({ deleted: true }));
};

// ============== Route Definitions ==============

export const sadaqahRouteDefinitions: RouteDefinition[] = [
    { route: listRoute, handler: listHandler, middleware: [requireAuth] },
    { route: addRoute, handler: addHandler, middleware: [requireAuth] },
    { route: getRoute, handler: getHandler, middleware: [requireAuth] },
    { route: deleteRoute, handler: deleteHandler, middleware: [requireAuth] },
];

// addHandler is already exported above
