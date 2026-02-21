import { healthRoute } from "./endpoints/health.routes";
import { statsRoute } from "./endpoints/stats.routes";
import * as boxesRoutes from "./endpoints/boxes.routes";
import * as sadaqahsRoutes from "./endpoints/sadaqahs.routes";
import * as currenciesRoutes from "./endpoints/currencies.routes";
import * as currencyTypesRoutes from "./endpoints/currency-types.routes";
import type { createRoute } from "@hono/zod-openapi";

export type RouteMetadata = ReturnType<typeof createRoute>;

export const allRouteMetadata: RouteMetadata[] = [
  healthRoute,
  statsRoute,
  // Boxes
  boxesRoutes.listRoute,
  boxesRoutes.createRoute,
  boxesRoutes.getRoute,
  boxesRoutes.updateRoute,
  boxesRoutes.deleteRoute,
  boxesRoutes.emptyRoute,
  boxesRoutes.collectionsRoute,
  // Sadaqahs
  sadaqahsRoutes.listRoute,
  sadaqahsRoutes.createRoute,
  sadaqahsRoutes.deleteRoute,
  // Currencies
  currenciesRoutes.listRoute,
  currenciesRoutes.createRoute,
  currenciesRoutes.getRoute,
  currenciesRoutes.deleteRoute,
  currenciesRoutes.updateGoldRatesRoute,
  // Currency Types
  currencyTypesRoutes.listRoute,
  currencyTypesRoutes.createRoute,
  currencyTypesRoutes.getRoute,
  currencyTypesRoutes.deleteRoute,
];
