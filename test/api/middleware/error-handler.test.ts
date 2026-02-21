/**
 * Tests for Error Handler Middleware
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { AppError, Errors } from "@/api/middleware/error-handler";
import { ZodError, z } from "zod";

// ============== AppError Tests ==============

describe("AppError", () => {
  test("should create error with message and code", () => {
    const error = new AppError("Test error", "TEST_ERROR");
    
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_ERROR");
    expect(error.status).toBe(500);
    expect(error.name).toBe("AppError");
  });

  test("should create error with custom status", () => {
    const error = new AppError("Not found", "NOT_FOUND", 404);
    
    expect(error.status).toBe(404);
  });

  test("should create error with details", () => {
    const details = { field: "name" };
    const error = new AppError("Validation failed", "VALIDATION_ERROR", 400, details);
    
    expect(error.details).toEqual(details);
  });

  test("should serialize to JSON", () => {
    const error = new AppError("Test error", "TEST_ERROR", 400, { key: "value" });
    const json = error.toJSON();
    
    expect(json.message).toBe("Test error");
    expect(json.code).toBe("TEST_ERROR");
    expect(json.status).toBe(400);
    expect(json.details).toEqual({ key: "value" });
  });

  test("should be instance of Error", () => {
    const error = new AppError("Test error", "TEST_ERROR");
    
    expect(error).toBeInstanceOf(Error);
  });
});

// ============== Errors Factory Tests ==============

describe("Errors factory", () => {
  test("should create not found error", () => {
    const error = Errors.notFound("Box", "box_123");
    
    expect(error.message).toBe('Box with id "box_123" not found');
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
  });

  test("should create not found error without id", () => {
    const error = Errors.notFound("Box");
    
    expect(error.message).toBe("Box not found");
  });

  test("should create validation error", () => {
    const error = Errors.validation("Invalid input", { field: "name" });
    
    expect(error.message).toBe("Invalid input");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(400);
    expect(error.details).toEqual({ field: "name" });
  });

  test("should create validation error without details", () => {
    const error = Errors.validation("Invalid input");
    
    expect(error.message).toBe("Invalid input");
    expect(error.details).toBeUndefined();
  });

  test("should create unauthorized error", () => {
    const error = Errors.unauthorized();
    
    expect(error.message).toBe("Unauthorized");
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.status).toBe(401);
  });

  test("should create unauthorized error with custom message", () => {
    const error = Errors.unauthorized("Please log in");
    
    expect(error.message).toBe("Please log in");
  });

  test("should create forbidden error", () => {
    const error = Errors.forbidden();
    
    expect(error.message).toBe("Forbidden");
    expect(error.code).toBe("FORBIDDEN");
    expect(error.status).toBe(403);
  });

  test("should create forbidden error with custom message", () => {
    const error = Errors.forbidden("Access denied");
    
    expect(error.message).toBe("Access denied");
  });

  test("should create conflict error", () => {
    const error = Errors.conflict("Resource already exists");
    
    expect(error.message).toBe("Resource already exists");
    expect(error.code).toBe("CONFLICT");
    expect(error.status).toBe(409);
  });

  test("should create internal error", () => {
    const error = Errors.internal();
    
    expect(error.message).toBe("Internal server error");
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.status).toBe(500);
  });

  test("should create internal error with custom message", () => {
    const error = Errors.internal("Something went wrong");
    
    expect(error.message).toBe("Something went wrong");
  });

  test("should create bad request error", () => {
    const error = Errors.badRequest("Invalid request");
    
    expect(error.message).toBe("Invalid request");
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.status).toBe(400);
  });
});

// ============== Error Type Guards Tests ==============

describe("Error type checking", () => {
  test("should identify AppError instance", () => {
    const error = new AppError("Test", "TEST");
    
    expect(error instanceof AppError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  test("should distinguish between error types", () => {
    const appError = new AppError("App error", "APP_ERROR");
    const normalError = new Error("Normal error");
    
    expect(appError instanceof AppError).toBe(true);
    expect(normalError instanceof AppError).toBe(false);
  });
});

// ============== Error Status Codes Tests ==============

describe("Error status codes", () => {
  test("should have correct status codes for common errors", () => {
    expect(Errors.badRequest("").status).toBe(400);
    expect(Errors.unauthorized().status).toBe(401);
    expect(Errors.forbidden().status).toBe(403);
    expect(Errors.notFound("").status).toBe(404);
    expect(Errors.conflict("").status).toBe(409);
    expect(Errors.internal().status).toBe(500);
  });
});

// ============== Error Codes Tests ==============

describe("Error codes", () => {
  test("should have correct codes for common errors", () => {
    expect(Errors.badRequest("").code).toBe("BAD_REQUEST");
    expect(Errors.unauthorized().code).toBe("UNAUTHORIZED");
    expect(Errors.forbidden().code).toBe("FORBIDDEN");
    expect(Errors.notFound("").code).toBe("NOT_FOUND");
    expect(Errors.conflict("").code).toBe("CONFLICT");
    expect(Errors.validation("").code).toBe("VALIDATION_ERROR");
    expect(Errors.internal().code).toBe("INTERNAL_ERROR");
  });
});
