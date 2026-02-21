/**
 * Tests for domain-specific errors
 */

import { describe, test, expect } from "bun:test";
import { AppError, Errors } from "@/api/middleware/error-handler";
import {
  EntityNotFoundError,
  ValidationError,
  AuthorizationError,
  AuthenticationError,
  ConflictError,
  BusinessRuleError,
  BoxError,
  BoxNotFoundError,
  BoxValidationError,
  SadaqahError,
  SadaqahNotFoundError,
  CurrencyError,
  CurrencyNotFoundError,
  TagError,
  TagNotFoundError,
  Result,
  tryAsync,
} from "@/api/errors/index";

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

  test("should create unauthorized error", () => {
    const error = Errors.unauthorized();
    
    expect(error.message).toBe("Unauthorized");
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.status).toBe(401);
  });

  test("should create forbidden error", () => {
    const error = Errors.forbidden();
    
    expect(error.message).toBe("Forbidden");
    expect(error.code).toBe("FORBIDDEN");
    expect(error.status).toBe(403);
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

  test("should create bad request error", () => {
    const error = Errors.badRequest("Invalid request");
    
    expect(error.message).toBe("Invalid request");
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.status).toBe(400);
  });
});

// ============== Entity Errors Tests ==============

describe("EntityNotFoundError", () => {
  test("should create error with entity and id", () => {
    const error = new EntityNotFoundError("Box", "box_123");
    
    expect(error.message).toBe('Box with id "box_123" not found');
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
    expect(error.entity).toBe("Box");
    expect(error.id).toBe("box_123");
  });
});

describe("ValidationError", () => {
  test("should create error with message", () => {
    const error = new ValidationError("Invalid input");
    
    expect(error.message).toBe("Invalid input");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(400);
  });

  test("should create error with details", () => {
    const details = { fields: ["name", "email"] };
    const error = new ValidationError("Validation failed", details);
    
    expect(error.details).toEqual(details);
  });
});

describe("AuthorizationError", () => {
  test("should create error with default message", () => {
    const error = new AuthorizationError();
    
    expect(error.message).toBe("Not authorized to perform this action");
    expect(error.code).toBe("FORBIDDEN");
    expect(error.status).toBe(403);
  });

  test("should create error with custom message", () => {
    const error = new AuthorizationError("You cannot delete this resource");
    
    expect(error.message).toBe("You cannot delete this resource");
  });
});

describe("AuthenticationError", () => {
  test("should create error with default message", () => {
    const error = new AuthenticationError();
    
    expect(error.message).toBe("Authentication required");
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.status).toBe(401);
  });
});

describe("ConflictError", () => {
  test("should create error with message", () => {
    const error = new ConflictError("Resource already exists");
    
    expect(error.message).toBe("Resource already exists");
    expect(error.code).toBe("CONFLICT");
    expect(error.status).toBe(409);
  });
});

describe("BusinessRuleError", () => {
  test("should create error with message", () => {
    const error = new BusinessRuleError("Cannot delete box with sadaqahs");
    
    expect(error.message).toBe("Cannot delete box with sadaqahs");
    expect(error.code).toBe("BUSINESS_RULE_VIOLATION");
    expect(error.status).toBe(422);
  });

  test("should create error with details", () => {
    const details = { sadaqahCount: 5 };
    const error = new BusinessRuleError("Cannot delete box", details);
    
    expect(error.details).toEqual(details);
  });
});

// ============== Domain-Specific Errors Tests ==============

describe("BoxError", () => {
  test("should create error with default values", () => {
    const error = new BoxError("Box operation failed");
    
    expect(error.message).toBe("Box operation failed");
    expect(error.code).toBe("BOX_ERROR");
    expect(error.status).toBe(400);
  });

  test("should create error with custom code and status", () => {
    const error = new BoxError("Box not accessible", "BOX_ACCESS_DENIED", 403);
    
    expect(error.code).toBe("BOX_ACCESS_DENIED");
    expect(error.status).toBe(403);
  });
});

describe("BoxNotFoundError", () => {
  test("should create error with box id", () => {
    const error = new BoxNotFoundError("box_123");
    
    expect(error.message).toBe('Box with id "box_123" not found');
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
    expect(error.entity).toBe("Box");
  });
});

describe("BoxValidationError", () => {
  test("should create error with message", () => {
    const error = new BoxValidationError("Box name is required");
    
    expect(error.message).toBe("Box name is required");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(400);
  });
});

describe("SadaqahError", () => {
  test("should create error with default values", () => {
    const error = new SadaqahError("Sadaqah operation failed");
    
    expect(error.message).toBe("Sadaqah operation failed");
    expect(error.code).toBe("SADAQAH_ERROR");
    expect(error.status).toBe(400);
  });
});

describe("SadaqahNotFoundError", () => {
  test("should create error with sadaqah id", () => {
    const error = new SadaqahNotFoundError("sadaqah_123");
    
    expect(error.message).toBe('Sadaqah with id "sadaqah_123" not found');
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
  });
});

describe("CurrencyError", () => {
  test("should create error with default values", () => {
    const error = new CurrencyError("Currency operation failed");
    
    expect(error.message).toBe("Currency operation failed");
    expect(error.code).toBe("CURRENCY_ERROR");
    expect(error.status).toBe(400);
  });
});

describe("CurrencyNotFoundError", () => {
  test("should create error with currency id", () => {
    const error = new CurrencyNotFoundError("cur_123");
    
    expect(error.message).toBe('Currency with id "cur_123" not found');
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
  });
});

describe("TagError", () => {
  test("should create error with default values", () => {
    const error = new TagError("Tag operation failed");
    
    expect(error.message).toBe("Tag operation failed");
    expect(error.code).toBe("TAG_ERROR");
    expect(error.status).toBe(400);
  });
});

describe("TagNotFoundError", () => {
  test("should create error with tag id", () => {
    const error = new TagNotFoundError("tag_123");
    
    expect(error.message).toBe('Tag with id "tag_123" not found');
    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
  });
});

// ============== Result Pattern Tests ==============

describe("Result", () => {
  describe("ok", () => {
    test("should create successful result", () => {
      const result = Result.ok({ id: "123" });
      
      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ id: "123" });
    });

    test("should work with primitive values", () => {
      const result = Result.ok(42);
      
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });
  });

  describe("err", () => {
    test("should create error result", () => {
      const error = new AppError("Test error", "TEST_ERROR");
      const result = Result.err(error);
      
      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
    });
  });

  describe("isOk", () => {
    test("should return true for successful result", () => {
      const result = Result.ok("value");
      
      expect(Result.isOk(result)).toBe(true);
    });

    test("should return false for error result", () => {
      const result = Result.err(new AppError("Error", "ERROR"));
      
      expect(Result.isOk(result)).toBe(false);
    });
  });

  describe("isErr", () => {
    test("should return true for error result", () => {
      const result = Result.err(new AppError("Error", "ERROR"));
      
      expect(Result.isErr(result)).toBe(true);
    });

    test("should return false for successful result", () => {
      const result = Result.ok("value");
      
      expect(Result.isErr(result)).toBe(false);
    });
  });

  describe("map", () => {
    test("should map successful result", () => {
      const result = Result.ok(5);
      const mapped = Result.map(result, (x) => x * 2);
      
      expect(mapped.ok).toBe(true);
      expect((mapped as { ok: true; value: number }).value).toBe(10);
    });

    test("should not map error result", () => {
      const error = new AppError("Error", "ERROR");
      const result = Result.err<number>(error);
      const mapped = Result.map(result, (x) => x * 2);
      
      expect(mapped.ok).toBe(false);
      expect((mapped as { ok: false; error: AppError }).error).toBe(error);
    });
  });

  describe("mapErr", () => {
    test("should not map successful result", () => {
      const result = Result.ok(5);
      const mapped = Result.mapErr(result, (e) => new AppError("New error", "NEW_ERROR"));
      
      expect(mapped.ok).toBe(true);
      expect((mapped as { ok: true; value: number }).value).toBe(5);
    });

    test("should map error result", () => {
      const error = new AppError("Error", "ERROR");
      const result = Result.err<number>(error);
      const newError = new AppError("New error", "NEW_ERROR");
      const mapped = Result.mapErr(result, () => newError);
      
      expect(mapped.ok).toBe(false);
      expect((mapped as { ok: false; error: AppError }).error).toBe(newError);
    });
  });

  describe("unwrap", () => {
    test("should return value for successful result", () => {
      const result = Result.ok("value");
      
      expect(Result.unwrap(result)).toBe("value");
    });

    test("should throw error for error result", () => {
      const error = new AppError("Error", "ERROR");
      const result = Result.err(error);
      
      expect(() => Result.unwrap(result)).toThrow(error);
    });
  });

  describe("unwrapOr", () => {
    test("should return value for successful result", () => {
      const result = Result.ok("value");
      
      expect(Result.unwrapOr(result, "default")).toBe("value");
    });

    test("should return default for error result", () => {
      const error = new AppError("Error", "ERROR");
      const result = Result.err<string>(error);
      
      expect(Result.unwrapOr(result, "default")).toBe("default");
    });
  });

  describe("andThen", () => {
    test("should chain successful results", () => {
      const result = Result.ok(5);
      const chained = Result.andThen(result, (x) => Result.ok(x * 2));
      
      expect(chained.ok).toBe(true);
      expect((chained as { ok: true; value: number }).value).toBe(10);
    });

    test("should propagate error result", () => {
      const error = new AppError("Error", "ERROR");
      const result = Result.err<number>(error);
      const chained = Result.andThen(result, (x) => Result.ok(x * 2));
      
      expect(chained.ok).toBe(false);
      expect((chained as { ok: false; error: AppError }).error).toBe(error);
    });

    test("should handle chained error", () => {
      const result = Result.ok(5);
      const error = new AppError("Chain error", "CHAIN_ERROR");
      const chained = Result.andThen(result, () => Result.err(error));
      
      expect(chained.ok).toBe(false);
      expect((chained as { ok: false; error: AppError }).error).toBe(error);
    });
  });
});

// ============== tryAsync Tests ==============

describe("tryAsync", () => {
  test("should return successful result for successful operation", async () => {
    const result = await tryAsync(() => Promise.resolve("value"));
    
    expect(result.ok).toBe(true);
    expect((result as { ok: true; value: string }).value).toBe("value");
  });

  test("should return error result for AppError thrown", async () => {
    const error = new AppError("Test error", "TEST_ERROR");
    const result = await tryAsync(() => Promise.reject(error));
    
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: AppError }).error).toBe(error);
  });

  test("should wrap non-AppError in AppError", async () => {
    const result = await tryAsync(() => Promise.reject(new Error("Generic error")));
    
    expect(result.ok).toBe(false);
    const appError = (result as { ok: false; error: AppError }).error;
    expect(appError.message).toBe("Generic error");
    expect(appError.code).toBe("INTERNAL_ERROR");
    expect(appError.status).toBe(500);
  });

  test("should handle string error", async () => {
    const result = await tryAsync(() => Promise.reject("String error"));
    
    expect(result.ok).toBe(false);
    const error = (result as { ok: false; error: AppError }).error;
    expect(error.message).toBe("Unknown error");
    expect(error.code).toBe("INTERNAL_ERROR");
  });
});
