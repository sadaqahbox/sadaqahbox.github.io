import { z } from "@hono/zod-openapi";
import {
  buildRoute,
  create200Response,
  create201Response,
  createIdParamSchema,
} from "../shared/route-builder";
import { CurrencyTypeSchema, CreateCurrencyTypeBodySchema } from "../dtos";

const CurrencyTypeIdParamSchema = createIdParamSchema("currencyTypeId");

export const listRoute = buildRoute({
  method: "get",
  path: "/api/currency-types",
  tags: ["Currency Types"],
  summary: "List all currency types",
  responses: create200Response(z.object({
    success: z.boolean(),
    currencyTypes: z.array(CurrencyTypeSchema),
  }), "Returns a list of currency types"),
  requireAuth: true,
});

export const createRoute = buildRoute({
  method: "post",
  path: "/api/currency-types",
  tags: ["Currency Types"],
  summary: "Create a new currency type",
  body: CreateCurrencyTypeBodySchema,
  responses: create201Response(z.object({
    success: z.boolean(),
    currencyType: CurrencyTypeSchema,
  }), "Returns the created currency type"),
  requireAuth: true,
});

export const getRoute = buildRoute({
  method: "get",
  path: "/api/currency-types/{currencyTypeId}",
  tags: ["Currency Types"],
  summary: "Get a currency type by ID",
  params: CurrencyTypeIdParamSchema,
  responses: create200Response(z.object({
    success: z.boolean(),
    currencyType: CurrencyTypeSchema,
  }), "Returns the currency type"),
  requireAuth: true,
});

export const deleteRoute = buildRoute({
  method: "delete",
  path: "/api/currency-types/{currencyTypeId}",
  tags: ["Currency Types"],
  summary: "Delete a currency type",
  params: CurrencyTypeIdParamSchema,
  responses: create200Response(z.object({
    success: z.boolean(),
    deleted: z.boolean(),
  }), "Returns deletion status"),
  requireAuth: true,
});
