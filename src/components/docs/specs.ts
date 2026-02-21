import { OpenAPIHono } from "@hono/zod-openapi";
import { allRouteMetadata } from "../../api/definitions";
import { docsAuth } from "../../auth/docs-auth";
import { openApiConfig } from "../../api/config/openapi";

/**
 * Generates the Hono API OpenAPI specification at runtime.
 */
export async function generateHonoSpec() {
  const app = new OpenAPIHono();

  // Register all routes (only metadata is needed for spec generation)
  for (const route of allRouteMetadata) {
    app.openapi(route, (c) => c.json({}));
  }

  // Generate the doc
  return app.getOpenAPI31Document(openApiConfig);
}

/**
 * Generates the Better Auth OpenAPI specification at runtime.
 */
export async function generateAuthSpec() {
  // Use the minimal docsAuth instance
  // @ts-ignore - generateOpenAPISchema exists in the plugin API
  return await docsAuth.api.generateOpenAPISchema();
}
