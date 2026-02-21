import { z } from "@hono/zod-openapi";
import {
  buildRoute,
  createIdParamSchema,
  create200Response,
  create201Response,
  create404Response,
} from "../shared/route-builder";
import {
  SadaqahSchema,
  AddSadaqahBodySchema,
  ListSadaqahsResponseSchema,
} from "../dtos";

const BoxIdParamSchema = createIdParamSchema("boxId");

const AddSadaqahResponseSchema = z.object({
  success: z.boolean(),
  sadaqahs: SadaqahSchema.array(),
  box: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    count: z.number(),
    totalValue: z.number(),
    totalValueExtra: z.record(z.string(), z.object({
      total: z.number(),
      code: z.string(),
      name: z.string(),
    })).nullable().optional(),
    currencyId: z.string().optional(),
    currency: z.any().nullable(),
    baseCurrencyId: z.string().optional(),
    baseCurrency: z.any().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  message: z.string(),
});

const DeleteSadaqahResponseSchema = z.object({
  success: z.boolean(),
  deleted: z.boolean(),
  updatedBox: z.object({
    id: z.string(),
    name: z.string(),
    count: z.number(),
    totalValue: z.number(),
    currencyId: z.string().optional(),
  }).optional(),
});

export const listRoute = buildRoute({
  method: "get",
  path: "/api/boxes/{boxId}/sadaqahs",
  tags: ["Sadaqahs"],
  summary: "List all sadaqahs in a box",
  params: BoxIdParamSchema,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  responses: {
    ...create200Response(ListSadaqahsResponseSchema, "Returns sadaqahs in the box"),
    ...create404Response("Box not found"),
  },
  requireAuth: true,
});

export const createRoute = buildRoute({
  method: "post",
  path: "/api/boxes/{boxId}/sadaqahs",
  tags: ["Sadaqahs"],
  summary: "Add a sadaqah to a box",
  params: BoxIdParamSchema,
  body: AddSadaqahBodySchema,
  responses: {
    ...create201Response(AddSadaqahResponseSchema, "Returns the created sadaqah and updated box"),
    ...create404Response("Box not found"),
  },
  requireAuth: true,
});

export const deleteRoute = buildRoute({
  method: "delete",
  path: "/api/boxes/{boxId}/sadaqahs/{sadaqahId}",
  tags: ["Sadaqahs"],
  summary: "Delete a sadaqah",
  params: z.object({
    boxId: z.string(),
    sadaqahId: z.string(),
  }),
  responses: {
    ...create200Response(DeleteSadaqahResponseSchema, "Sadaqah deleted"),
    ...create404Response("Sadaqah not found"),
  },
  requireAuth: true,
});
