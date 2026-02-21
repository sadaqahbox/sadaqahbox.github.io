/**
 * Tests for Schema Helpers
 */

import { describe, test, expect } from "bun:test";
import { z } from "@hono/zod-openapi";
import {
  SuccessResponseSchema,
  ErrorResponseSchema,
  NotFoundResponseSchema,
  create200Response,
  create201Response,
  create204Response,
  create400Response,
  create401Response,
  create403Response,
  create404Response,
  create409Response,
  create422Response,
  create429Response,
  create500Response,
  PaginationQuerySchema,
  PaginationSchema,
  createPaginatedResponse,
  createIdParamSchema,
  createItemResponseSchema,
  createSuccessResponseSchema,
  IsoDateSchema,
  IdSchema,
  NonEmptyStringSchema,
  OptionalStringSchema,
  MetadataSchema,
  ErrorCodeSchema,
} from "@/api/shared/schema-helpers";

// ============== Response Schema Tests ==============

describe("SuccessResponseSchema", () => {
  test("should validate success response", () => {
    const result = SuccessResponseSchema.safeParse({ success: true });
    expect(result.success).toBe(true);
  });

  test("should reject non-boolean success", () => {
    const result = SuccessResponseSchema.safeParse({ success: "true" });
    expect(result.success).toBe(false);
  });
});

describe("ErrorResponseSchema", () => {
  test("should validate error response with required fields", () => {
    const result = ErrorResponseSchema.safeParse({
      success: false,
      error: "Something went wrong",
    });
    expect(result.success).toBe(true);
  });

  test("should validate error response with optional code", () => {
    const result = ErrorResponseSchema.safeParse({
      success: false,
      error: "Not found",
      code: "NOT_FOUND",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("NOT_FOUND");
    }
  });
});

describe("NotFoundResponseSchema", () => {
  test("should validate not found response", () => {
    const result = NotFoundResponseSchema.safeParse({
      success: false,
      error: "Resource not found",
    });
    expect(result.success).toBe(true);
  });
});

// ============== Response Factory Tests ==============

describe("create200Response", () => {
  test("should create 200 response config", () => {
    const schema = z.object({ id: z.string() });
    const config = create200Response(schema, "Success response");
    
    expect(config[200]).toBeDefined();
    expect(config[200].description).toBe("Success response");
    expect(config[200].content["application/json"].schema).toBe(schema);
  });

  test("should use default description", () => {
    const schema = z.object({ id: z.string() });
    const config = create200Response(schema);
    
    expect(config[200].description).toBe("Success");
  });
});

describe("create201Response", () => {
  test("should create 201 response config", () => {
    const schema = z.object({ id: z.string() });
    const config = create201Response(schema, "Created successfully");
    
    expect(config[201]).toBeDefined();
    expect(config[201].description).toBe("Created successfully");
  });

  test("should use default description", () => {
    const schema = z.object({ id: z.string() });
    const config = create201Response(schema);
    
    expect(config[201].description).toBe("Created");
  });
});

describe("create204Response", () => {
  test("should create 204 response config", () => {
    const config = create204Response("Deleted successfully");
    
    expect(config[204]).toBeDefined();
    expect(config[204].description).toBe("Deleted successfully");
  });

  test("should use default description", () => {
    const config = create204Response();
    
    expect(config[204].description).toBe("No content");
  });
});

describe("create400Response", () => {
  test("should create 400 response config", () => {
    const config = create400Response("Invalid input");
    
    expect(config[400]).toBeDefined();
    expect(config[400].description).toBe("Invalid input");
  });

  test("should use default description", () => {
    const config = create400Response();
    
    expect(config[400].description).toBe("Bad request");
  });
});

describe("create401Response", () => {
  test("should create 401 response config", () => {
    const config = create401Response("Please log in");
    
    expect(config[401]).toBeDefined();
    expect(config[401].description).toBe("Please log in");
  });

  test("should use default description", () => {
    const config = create401Response();
    
    expect(config[401].description).toBe("Unauthorized");
  });
});

describe("create403Response", () => {
  test("should create 403 response config", () => {
    const config = create403Response("Access denied");
    
    expect(config[403]).toBeDefined();
    expect(config[403].description).toBe("Access denied");
  });

  test("should use default description", () => {
    const config = create403Response();
    
    expect(config[403].description).toBe("Forbidden");
  });
});

describe("create404Response", () => {
  test("should create 404 response config", () => {
    const config = create404Response("Resource not found");
    
    expect(config[404]).toBeDefined();
    expect(config[404].description).toBe("Resource not found");
  });

  test("should use default description", () => {
    const config = create404Response();
    
    expect(config[404].description).toBe("Not found");
  });
});

describe("create409Response", () => {
  test("should create 409 response config", () => {
    const config = create409Response("Duplicate entry");
    
    expect(config[409]).toBeDefined();
    expect(config[409].description).toBe("Duplicate entry");
  });

  test("should use default description", () => {
    const config = create409Response();
    
    expect(config[409].description).toBe("Conflict");
  });
});

describe("create422Response", () => {
  test("should create 422 response config", () => {
    const config = create422Response("Invalid data");
    
    expect(config[422]).toBeDefined();
    expect(config[422].description).toBe("Invalid data");
  });

  test("should use default description", () => {
    const config = create422Response();
    
    expect(config[422].description).toBe("Validation error");
  });
});

describe("create429Response", () => {
  test("should create 429 response config", () => {
    const config = create429Response("Rate limit exceeded");
    
    expect(config[429]).toBeDefined();
    expect(config[429].description).toBe("Rate limit exceeded");
  });

  test("should use default description", () => {
    const config = create429Response();
    
    expect(config[429].description).toBe("Too many requests");
  });
});

describe("create500Response", () => {
  test("should create 500 response config", () => {
    const config = create500Response("Server error");
    
    expect(config[500]).toBeDefined();
    expect(config[500].description).toBe("Server error");
  });

  test("should use default description", () => {
    const config = create500Response();
    
    expect(config[500].description).toBe("Internal server error");
  });
});

// ============== Pagination Schema Tests ==============

describe("PaginationQuerySchema", () => {
  test("should use defaults for empty input", async () => {
    const result = await PaginationQuerySchema.parseAsync({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  test("should coerce string numbers", async () => {
    const result = await PaginationQuerySchema.parseAsync({ page: "2", limit: "50" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  test("should reject non-positive page", async () => {
    expect(PaginationQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(PaginationQuerySchema.safeParse({ page: -1 }).success).toBe(false);
  });

  test("should reject limit over 100", async () => {
    expect(PaginationQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});

describe("PaginationSchema", () => {
  test("should validate pagination object", () => {
    const result = PaginationSchema.safeParse({
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
    });
    expect(result.success).toBe(true);
  });

  test("should reject non-positive page", () => {
    const result = PaginationSchema.safeParse({
      page: 0,
      limit: 20,
      total: 100,
      totalPages: 5,
    });
    expect(result.success).toBe(false);
  });

  test("should accept zero total", () => {
    const result = PaginationSchema.safeParse({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("createPaginatedResponse", () => {
  test("should create paginated response schema", () => {
    const itemSchema = z.object({ id: z.string() });
    const schema = createPaginatedResponse(itemSchema, "items");
    
    const result = schema.safeParse({
      success: true,
      items: [{ id: "1" }, { id: "2" }],
      total: 2,
    });
    
    expect(result.success).toBe(true);
  });

  test("should validate empty items array", () => {
    const itemSchema = z.object({ id: z.string() });
    const schema = createPaginatedResponse(itemSchema, "boxes");
    
    const result = schema.safeParse({
      success: true,
      boxes: [],
      total: 0,
    });
    
    expect(result.success).toBe(true);
  });
});

// ============== ID Parameter Tests ==============

describe("createIdParamSchema", () => {
  test("should create ID param schema with default description", () => {
    const schema = createIdParamSchema("boxId");
    
    const result = schema.safeParse({ boxId: "box_123" });
    expect(result.success).toBe(true);
  });

  test("should create ID param schema with custom description", () => {
    const schema = createIdParamSchema("id", "The unique identifier");
    
    const result = schema.safeParse({ id: "test_123" });
    expect(result.success).toBe(true);
  });
});

// ============== Item Response Tests ==============

describe("createItemResponseSchema", () => {
  test("should create item response schema", () => {
    const itemSchema = z.object({ id: z.string(), name: z.string() });
    const schema = createItemResponseSchema(itemSchema, "box");
    
    const result = schema.safeParse({
      success: true,
      box: { id: "box_123", name: "Test Box" },
    });
    
    expect(result.success).toBe(true);
  });
});

describe("createSuccessResponseSchema", () => {
  test("should create success response schema", () => {
    const dataSchema = z.object({ count: z.number() });
    const schema = createSuccessResponseSchema(dataSchema, "stats");
    
    const result = schema.safeParse({
      success: true,
      stats: { count: 42 },
    });
    
    expect(result.success).toBe(true);
  });
});

// ============== Common Field Schema Tests ==============

describe("IsoDateSchema", () => {
  test("should accept Date object", async () => {
    const date = new Date("2024-01-15T10:30:00Z");
    const result = await IsoDateSchema.parseAsync(date);
    expect(result).toBe(date.toISOString());
  });

  test("should accept ISO string", async () => {
    const isoString = "2024-01-15T10:30:00Z";
    const result = await IsoDateSchema.parseAsync(isoString);
    expect(result).toBe(isoString);
  });
});

describe("IdSchema", () => {
  test("should accept valid ID format", () => {
    const validIds = ["box_abc123", "sadaqah_xyz789"];
    
    validIds.forEach(id => {
      expect(IdSchema.safeParse(id).success).toBe(true);
    });
  });

  test("should reject invalid ID format", () => {
    const invalidIds = ["Box_abc123", "abc123", "box-abc123", "box_", "_abc123"];
    
    invalidIds.forEach(id => {
      expect(IdSchema.safeParse(id).success).toBe(false);
    });
  });
});

describe("NonEmptyStringSchema", () => {
  test("should accept non-empty string", () => {
    expect(NonEmptyStringSchema.safeParse("hello").success).toBe(true);
  });

  test("should reject empty string", () => {
    expect(NonEmptyStringSchema.safeParse("").success).toBe(false);
  });
});

describe("OptionalStringSchema", () => {
  test("should accept string value", () => {
    expect(OptionalStringSchema.safeParse("hello").success).toBe(true);
  });

  test("should accept undefined", () => {
    expect(OptionalStringSchema.safeParse(undefined).success).toBe(true);
  });
});

describe("MetadataSchema", () => {
  test("should accept valid metadata", () => {
    const result = MetadataSchema.safeParse({ key1: "value1", key2: "value2" });
    expect(result.success).toBe(true);
  });

  test("should accept undefined", () => {
    expect(MetadataSchema.safeParse(undefined).success).toBe(true);
  });

  test("should reject non-string values", () => {
    const result = MetadataSchema.safeParse({ key: 123 });
    expect(result.success).toBe(false);
  });
});

describe("ErrorCodeSchema", () => {
  test("should accept valid error codes", () => {
    const validCodes = [
      "BAD_REQUEST",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "CONFLICT",
      "VALIDATION_ERROR",
      "RATE_LIMIT_EXCEEDED",
      "INTERNAL_ERROR",
    ];
    
    validCodes.forEach(code => {
      expect(ErrorCodeSchema.safeParse(code).success).toBe(true);
    });
  });

  test("should reject invalid error codes", () => {
    expect(ErrorCodeSchema.safeParse("INVALID_CODE").success).toBe(false);
    expect(ErrorCodeSchema.safeParse("bad_request").success).toBe(false);
  });
});
