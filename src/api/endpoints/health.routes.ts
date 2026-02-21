import { buildRoute, create200Response } from "../shared/route-builder";
import { HealthResponseSchema } from "../dtos";

export const healthRoute = buildRoute({
  method: "get",
  path: "/api/health",
  tags: ["System"],
  summary: "Health check",
  responses: create200Response(HealthResponseSchema, "API health status"),
  requireAuth: false,
});
