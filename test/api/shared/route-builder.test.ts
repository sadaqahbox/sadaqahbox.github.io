/**
 * Tests for Route Builder
 */

import { describe, test, expect } from "bun:test";
import { z } from "@hono/zod-openapi";
import {
  buildRoute,
  getParams,
  getQuery,
  getBody,
  jsonSuccess,
  SuccessResponseSchema,
  ErrorResponseSchema,
  PaginationQuerySchema,
  createIdParamSchema,
  create200Response,
  create201Response,
  IdSchema,
  NonEmptyStringSchema,
} from "@/api/shared/route-builder";

// ============== buildRoute Tests ==============

describe("buildRoute", () => {
  test("should create route config with basic options", () => {
    const route = buildRoute({
      method: "get",
      path: "/api/test",
      tags: ["Test"],
      summary: "Test endpoint",
      responses: create200Response(z.object({ success: z.boolean() })),
    });

    expect(route).toBeDefined();
  });

  test("should create route with params", () => {
    const route = buildRoute({
      method: "get",
      path: "/api/test/:id",
      tags: ["Test"],
      summary: "Get by ID",
      params: createIdParamSchema("id"),
      responses: create200Response(z.object({ id: z.string() })),
    });

    expect(route).toBeDefined();
  });

  test("should create route with query params", () => {
    const route = buildRoute({
      method: "get",
      path: "/api/test",
      tags: ["Test"],
      summary: "List items",
      query: PaginationQuerySchema,
      responses: create200Response(z.object({ items: z.array(z.any()) })),
    });

    expect(route).toBeDefined();
  });

  test("should create route with body", () => {
    const route = buildRoute({
      method: "post",
      path: "/api/test",
      tags: ["Test"],
      summary: "Create item",
      body: z.object({ name: z.string() }),
      responses: create201Response(z.object({ id: z.string() })),
    });

    expect(route).toBeDefined();
  });

  test("should create route with auth required", () => {
    const route = buildRoute({
      method: "post",
      path: "/api/protected",
      tags: ["Protected"],
      summary: "Protected endpoint",
      requireAuth: true,
      responses: create200Response(z.object({ success: z.boolean() })),
    });

    expect(route).toBeDefined();
  });

  test("should create route without auth by default", () => {
    const route = buildRoute({
      method: "get",
      path: "/api/public",
      tags: ["Public"],
      summary: "Public endpoint",
      responses: create200Response(z.object({ success: z.boolean() })),
    });

    expect(route).toBeDefined();
  });
});

// ============== jsonSuccess Tests ==============

describe("jsonSuccess", () => {
  test("should create success response with data", () => {
    const mockJson = (data: unknown, status: number) => ({ data, status });
    const mockContext = { json: mockJson } as any;

    const response = jsonSuccess(mockContext, { id: "123", name: "Test" }) as unknown as { data: unknown; status: number };

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ success: true, id: "123", name: "Test" });
  });

  test("should create success response with 201 status", () => {
    const mockJson = (data: unknown, status: number) => ({ data, status });
    const mockContext = { json: mockJson } as any;

    const response = jsonSuccess(mockContext, { id: "123" }, 201);

    expect(response.status).toBe(201);
  });
});

// ============== Re-exported Schema Tests ==============

describe("Re-exported schemas", () => {
  test("should export SuccessResponseSchema", () => {
    expect(SuccessResponseSchema).toBeDefined();
    
    const result = SuccessResponseSchema.safeParse({ success: true });
    expect(result.success).toBe(true);
  });

  test("should export ErrorResponseSchema", () => {
    expect(ErrorResponseSchema).toBeDefined();
    
    const result = ErrorResponseSchema.safeParse({
      success: false,
      error: "Test error",
    });
    expect(result.success).toBe(true);
  });

  test("should export PaginationQuerySchema", () => {
    expect(PaginationQuerySchema).toBeDefined();
    
    const result = PaginationQuerySchema.safeParse({ page: 1, limit: 10 });
    expect(result.success).toBe(true);
  });

  test("should export createIdParamSchema", () => {
    expect(createIdParamSchema).toBeDefined();
    
    const schema = createIdParamSchema("id");
    const result = schema.safeParse({ id: "test_123" });
    expect(result.success).toBe(true);
  });

  test("should export create200Response", () => {
    expect(create200Response).toBeDefined();
    
    const config = create200Response(z.object({ id: z.string() }));
    expect(config[200]).toBeDefined();
  });

  test("should export create201Response", () => {
    expect(create201Response).toBeDefined();
    
    const config = create201Response(z.object({ id: z.string() }));
    expect(config[201]).toBeDefined();
  });

  test("should export IdSchema", () => {
    expect(IdSchema).toBeDefined();
    
    const result = IdSchema.safeParse("box_abc123");
    expect(result.success).toBe(true);
  });

  test("should export NonEmptyStringSchema", () => {
    expect(NonEmptyStringSchema).toBeDefined();
    
    const result = NonEmptyStringSchema.safeParse("test");
    expect(result.success).toBe(true);
  });
});

// ============== Route Method Types Tests ==============

describe("Route method types", () => {
  test("should support GET method", () => {
    const route = buildRoute({
      method: "get",
      path: "/api/test",
      tags: ["Test"],
      summary: "GET endpoint",
      responses: create200Response(z.object({})),
    });
    expect(route).toBeDefined();
  });

  test("should support POST method", () => {
    const route = buildRoute({
      method: "post",
      path: "/api/test",
      tags: ["Test"],
      summary: "POST endpoint",
      responses: create201Response(z.object({})),
    });
    expect(route).toBeDefined();
  });

  test("should support PATCH method", () => {
    const route = buildRoute({
      method: "patch",
      path: "/api/test/:id",
      tags: ["Test"],
      summary: "PATCH endpoint",
      responses: create200Response(z.object({})),
    });
    expect(route).toBeDefined();
  });

  test("should support PUT method", () => {
    const route = buildRoute({
      method: "put",
      path: "/api/test/:id",
      tags: ["Test"],
      summary: "PUT endpoint",
      responses: create200Response(z.object({})),
    });
    expect(route).toBeDefined();
  });

  test("should support DELETE method", () => {
    const route = buildRoute({
      method: "delete",
      path: "/api/test/:id",
      tags: ["Test"],
      summary: "DELETE endpoint",
      responses: create200Response(z.object({})),
    });
    expect(route).toBeDefined();
  });
});
