import { z } from "@hono/zod-openapi";
import {
  buildRoute,
  create200Response,
  create201Response,
  createIdParamSchema,
} from "../shared/route-builder";
import { CurrencySchema, CreateCurrencyBodySchema } from "../dtos";

const CurrencyIdParamSchema = createIdParamSchema("currencyId");

export const listRoute = buildRoute({
  method: "get",
  path: "/api/currencies",
  tags: ["Currencies"],
  summary: "List all currencies",
  responses: create200Response(z.object({
    success: z.boolean(),
    currencies: z.array(CurrencySchema),
  }), "Returns a list of currencies"),
  requireAuth: true,
});

export const createRoute = buildRoute({
  method: "post",
  path: "/api/currencies",
  tags: ["Currencies"],
  summary: "Create a new currency",
  body: CreateCurrencyBodySchema,
  responses: create201Response(z.object({
    success: z.boolean(),
    currency: CurrencySchema,
  }), "Returns the created currency"),
  requireAuth: true,
});

export const getRoute = buildRoute({
  method: "get",
  path: "/api/currencies/{currencyId}",
  tags: ["Currencies"],
  summary: "Get a currency by ID",
  params: CurrencyIdParamSchema,
  responses: create200Response(z.object({
    success: z.boolean(),
    currency: CurrencySchema,
  }), "Returns the currency"),
  requireAuth: true,
});

export const deleteRoute = buildRoute({
  method: "delete",
  path: "/api/currencies/{currencyId}",
  tags: ["Currencies"],
  summary: "Delete a currency",
  params: CurrencyIdParamSchema,
  responses: create200Response(z.object({
    success: z.boolean(),
    deleted: z.boolean(),
  }), "Returns deletion status"),
  requireAuth: true,
});

export const updateGoldRatesRoute = buildRoute({
  method: "post",
  path: "/api/currencies/update-gold-rates",
  tags: ["Currencies"],
  summary: "Update gold rates for all currencies",
  description: "Fetches latest gold prices from external APIs and updates all currency gold values. Admin only.",
  responses: create200Response(z.object({
    success: z.boolean(),
    updated: z.number(),
    errors: z.array(z.string()).optional(),
  }), "Returns number of currencies updated"),
  requireAuth: true,
});

export const syncCachedRatesRoute = buildRoute({
  method: "post",
  path: "/api/currencies/sync-cached-rates",
  tags: ["Currencies"],
  summary: "Sync cached rates to currencies",
  description: "Syncs rates from currency_rate_attempt cache to currency table. Admin only.",
  responses: create200Response(z.object({
    success: z.boolean(),
    updated: z.number(),
    skipped: z.number(),
  }), "Returns sync results"),
  requireAuth: true,
});
