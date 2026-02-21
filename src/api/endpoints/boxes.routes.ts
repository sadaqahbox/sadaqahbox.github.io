import { z } from "@hono/zod-openapi";
import {
  buildRoute,
  createIdParamSchema,
  create200Response,
  create201Response,
  create404Response,
} from "../shared/route-builder";
import {
  BoxSchema,
  CreateBoxBodySchema,
  UpdateBoxBodySchema,
  ListBoxesResponseSchema,
  GetBoxResponseSchema,
  DeleteBoxResponseSchema,
  EmptyBoxResponseSchema,
  ListCollectionsResponseSchema,
} from "../dtos";

const BoxIdParamSchema = createIdParamSchema("boxId");

const ListQuerySchema = z.object({
  sortBy: z.enum(["name", "createdAt", "count", "totalValue"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const listRoute = buildRoute({
  method: "get",
  path: "/api/boxes",
  tags: ["Boxes"],
  summary: "List all charity boxes",
  query: ListQuerySchema,
  responses: create200Response(ListBoxesResponseSchema, "Returns a list of boxes"),
  requireAuth: true,
});

export const createRoute = buildRoute({
  method: "post",
  path: "/api/boxes",
  tags: ["Boxes"],
  summary: "Create a new charity box",
  body: CreateBoxBodySchema,
  responses: create201Response(z.object({
    success: z.boolean(),
    box: BoxSchema,
  }), "Returns the created box"),
  requireAuth: true,
});

export const getRoute = buildRoute({
  method: "get",
  path: "/api/boxes/{boxId}",
  tags: ["Boxes"],
  summary: "Get a box with detailed stats",
  params: BoxIdParamSchema,
  responses: {
    ...create200Response(GetBoxResponseSchema, "Returns the box"),
    ...create404Response("Box not found"),
  },
  requireAuth: true,
});

export const updateRoute = buildRoute({
  method: "patch",
  path: "/api/boxes/{boxId}",
  tags: ["Boxes"],
  summary: "Update a box",
  params: BoxIdParamSchema,
  body: UpdateBoxBodySchema,
  responses: {
    ...create200Response(z.object({ success: z.boolean(), box: BoxSchema }), "Returns the updated box"),
    ...create404Response("Box not found"),
  },
  requireAuth: true,
});

export const deleteRoute = buildRoute({
  method: "delete",
  path: "/api/boxes/{boxId}",
  tags: ["Boxes"],
  summary: "Delete a box",
  params: BoxIdParamSchema,
  responses: {
    ...create200Response(DeleteBoxResponseSchema, "Box deleted"),
    ...create404Response("Box not found"),
  },
  requireAuth: true,
});

export const emptyRoute = buildRoute({
  method: "post",
  path: "/api/boxes/{boxId}/empty",
  tags: ["Boxes"],
  summary: "Empty a box (collect all sadaqahs)",
  params: BoxIdParamSchema,
  responses: {
    ...create200Response(EmptyBoxResponseSchema, "Box emptied"),
    ...create404Response("Box not found"),
  },
  requireAuth: true,
});

export const collectionsRoute = buildRoute({
  method: "get",
  path: "/api/boxes/{boxId}/collections",
  tags: ["Boxes"],
  summary: "Get collection history for a box",
  params: BoxIdParamSchema,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  responses: {
    ...create200Response(ListCollectionsResponseSchema, "Returns collection history"),
    ...create404Response("Box not found"),
  },
  requireAuth: true,
});
