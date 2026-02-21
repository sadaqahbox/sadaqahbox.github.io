/**
 * Tests for HTTP response utilities
 */

import { describe, test, expect } from "bun:test";
import {
  success,
  paginated,
  error,
  jsonError,
  notFound,
  validationError,
  conflict,
  createPagination,
  normalizePagination,
  getOffset,
} from "@/api/shared/response";

// ============== success Tests ==============

describe("success", () => {
  test("should create success response with data", () => {
    const result = success({ id: "123", name: "Test" });
    
    expect(result.success).toBe(true);
    expect(result.id).toBe("123");
    expect(result.name).toBe("Test");
  });

  test("should merge multiple properties", () => {
    const result = success({ count: 5, total: 100 });
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(5);
    expect(result.total).toBe(100);
  });

  test("should work with nested objects", () => {
    const result = success({
      user: { id: "1", name: "John" },
      items: [1, 2, 3],
    });
    
    expect(result.success).toBe(true);
    expect(result.user.id).toBe("1");
    expect(result.items).toEqual([1, 2, 3]);
  });
});

// ============== paginated Tests ==============

describe("paginated", () => {
  test("should create paginated response", () => {
    const items = [{ id: "1" }, { id: "2" }];
    const pagination = { page: 1, limit: 10, total: 25, totalPages: 3 };
    
    const result = paginated(items, pagination);
    
    expect(result.success).toBe(true);
    expect(result.items).toEqual(items);
    expect(result.pagination).toEqual(pagination);
  });

  test("should work with empty items", () => {
    const pagination = { page: 1, limit: 10, total: 0, totalPages: 0 };
    
    const result = paginated([], pagination);
    
    expect(result.success).toBe(true);
    expect(result.items).toEqual([]);
  });
});

// ============== error Tests ==============

describe("error", () => {
  test("should create error response with message", () => {
    const result = error("Something went wrong");
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong");
    expect(result.code).toBeUndefined();
    expect(result.details).toBeUndefined();
  });

  test("should include code when provided", () => {
    const result = error("Not found", "NOT_FOUND");
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not found");
    expect(result.code).toBe("NOT_FOUND");
  });

  test("should include details when provided", () => {
    const details = { field: "name", message: "Required" };
    const result = error("Validation failed", "VALIDATION_ERROR", details);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("Validation failed");
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(result.details).toEqual(details);
  });
});

// ============== jsonError Tests ==============

describe("jsonError", () => {
  test("should create JSON error response with default status", async () => {
    const response = jsonError("Bad request");
    
    expect(response.status).toBe(400);
    const body = await response.json() as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe("Bad request");
  });

  test("should create JSON error response with custom status", async () => {
    const response = jsonError("Internal error", 500);
    
    expect(response.status).toBe(500);
    const body = await response.json() as { error: string };
    expect(body.error).toBe("Internal error");
  });
});

// ============== notFound Tests ==============

describe("notFound", () => {
  test("should create not found response with resource name", async () => {
    const response = notFound("Box");
    
    expect(response.status).toBe(404);
    const body = await response.json() as { success: boolean; error: string; code: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe("Box not found");
    expect(body.code).toBe("NOT_FOUND");
  });

  test("should include ID in message when provided", async () => {
    const response = notFound("Box", "box_123");
    
    const body = await response.json() as { error: string };
    expect(body.error).toBe('Box with id "box_123" not found');
  });
});

// ============== validationError Tests ==============

describe("validationError", () => {
  test("should create validation error response", async () => {
    const response = validationError("Invalid input");
    
    expect(response.status).toBe(400);
    const body = await response.json() as { success: boolean; error: string; code: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe("Invalid input");
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  test("should include details when provided", async () => {
    const details = { fields: ["name", "email"] };
    const response = validationError("Validation failed", details);
    
    const body = await response.json() as { details: typeof details };
    expect(body.details).toEqual(details);
  });
});

// ============== conflict Tests ==============

describe("conflict", () => {
  test("should create conflict error response", async () => {
    const response = conflict("Resource already exists");
    
    expect(response.status).toBe(409);
    const body = await response.json() as { success: boolean; error: string; code: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe("Resource already exists");
    expect(body.code).toBe("CONFLICT");
  });
});

// ============== createPagination Tests ==============

describe("createPagination", () => {
  test("should create pagination info", () => {
    const result = createPagination(1, 10, 25);
    
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  test("should calculate correct total pages for exact multiple", () => {
    const result = createPagination(1, 10, 30);
    
    expect(result.totalPages).toBe(3);
  });

  test("should handle zero total", () => {
    const result = createPagination(1, 10, 0);
    
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  test("should round up total pages", () => {
    const result = createPagination(1, 10, 21);
    
    expect(result.totalPages).toBe(3);
  });
});

// ============== normalizePagination Tests ==============

describe("normalizePagination", () => {
  test("should use defaults for undefined values", () => {
    const result = normalizePagination();
    
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  test("should use provided values", () => {
    const result = normalizePagination(2, 50);
    
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  test("should enforce minimum page of 1", () => {
    const result = normalizePagination(0);
    
    expect(result.page).toBe(1);
  });

  test("should enforce minimum limit of 1", () => {
    const result = normalizePagination(1, 0);
    
    expect(result.limit).toBe(1);
  });

  test("should enforce maximum limit of 100", () => {
    const result = normalizePagination(1, 200);
    
    expect(result.limit).toBe(100);
  });

  test("should handle negative values", () => {
    const result = normalizePagination(-5, -10);
    
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
  });
});

// ============== getOffset Tests ==============

describe("getOffset", () => {
  test("should calculate offset for first page", () => {
    expect(getOffset(1, 10)).toBe(0);
  });

  test("should calculate offset for second page", () => {
    expect(getOffset(2, 10)).toBe(10);
  });

  test("should calculate offset for third page", () => {
    expect(getOffset(3, 10)).toBe(20);
  });

  test("should handle different limit values", () => {
    expect(getOffset(1, 20)).toBe(0);
    expect(getOffset(2, 20)).toBe(20);
    expect(getOffset(3, 20)).toBe(40);
  });

  test("should handle large page numbers", () => {
    expect(getOffset(100, 10)).toBe(990);
  });
});
