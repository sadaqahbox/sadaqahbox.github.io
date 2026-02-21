/**
 * Tag endpoints
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { TagSchema, BoxSchema, CreateTagBodySchema, createItemResponseSchema } from "../domain/schemas";
import { getTagEntity } from "../entities";
import { getCurrentUser, requireAuth, requireAdmin } from "../middleware";
import { success, notFound } from "../shared/response";
import {
    buildRoute,
    getParams,
    createIdParamSchema,
    create200Response,
    create404Response,
    type RouteDefinition,
} from "../shared/route-builder";
import { createCrud } from "../shared/crud-factory";
import type { Tag, CreateTagOptions } from "../domain/types";

// ============== CRUD Routes (Factory Generated) ==============

const crud = createCrud<Tag, CreateTagOptions, unknown>({
    resourceName: "Tag",
    tagName: "Tags",
    path: "/api/tags",
    idParam: "tagId",
    schemas: {
        item: TagSchema,
        create: CreateTagBodySchema,
    },
    getEntity: getTagEntity,
    getCreateInput: (body, _c) => ({
        name: String(body.name),
        color: body.color ? String(body.color) : undefined,
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

// ============== Custom Route: Get Boxes with Tag ==============

const BoxesResponseSchema = z.object({
    success: z.boolean(),
    tag: TagSchema,
    boxes: BoxSchema.array(),
});

export const boxesRoute = buildRoute({
    method: "get",
    path: "/api/tags/{tagId}/boxes",
    tags: ["Tags"],
    summary: "Get all boxes with a specific tag",
    params: createIdParamSchema("tagId"),
    responses: {
        ...create200Response(BoxesResponseSchema, "Returns boxes"),
        ...create404Response("Tag not found"),
    },
});

export const boxesHandler = async (c: Context<{ Bindings: Env }>) => {
    const user = getCurrentUser(c);
    const { tagId } = getParams<{ tagId: string }>(c);

    const tagEntity = getTagEntity(c);

    const tag = await tagEntity.get(tagId);
    if (!tag) {
        return notFound("Tag", tagId);
    }

    const boxes = await tagEntity.getBoxes(tagId, user?.id);
    return c.json(success({ tag, boxes }));
};

// ============== Combined Route Definitions ==============

export const tagRouteDefinitions: RouteDefinition[] = [
    // Public routes (no auth)
    { route: listRoute, handler: listHandler },
    { route: getRoute, handler: getHandler },
    { route: boxesRoute, handler: boxesHandler },
    // Admin routes (require auth)
    { route: createRoute, handler: createHandler, middleware: [requireAuth, requireAdmin] },
    { route: deleteRoute, handler: deleteHandler, middleware: [requireAuth, requireAdmin] },
];
