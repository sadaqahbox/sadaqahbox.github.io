import { buildRoute, create200Response } from "../shared/route-builder";
import { StatsResponseSchema } from "../dtos";

export const statsRoute = buildRoute({
  method: "get",
  path: "/api/stats",
  tags: ["Stats"],
  summary: "Get user statistics",
  responses: create200Response(StatsResponseSchema, "User statistics"),
  requireAuth: true,
});
