/**
 * Tests for validation utilities
 */

import { describe, test, expect } from "bun:test";
import {
  sanitizeString,
  isNonEmptyString,
  isValidDateRange,
  isValidISODate,
  isPositiveNumber,
  isNonNegativeNumber,
  BoxNameSchema,
  BoxDescriptionSchema,
  ColorHexSchema,
  CurrencyCodeSchema,
  PaginationParamsSchema,
} from "@/api/shared/validators";

// ============== sanitizeString Tests ==============

describe("sanitizeString", () => {
  test("should return undefined for undefined input", () => {
    expect(sanitizeString(undefined)).toBeUndefined();
  });

  test("should return undefined for null input", () => {
    expect(sanitizeString(null)).toBeUndefined();
  });

  test("should return undefined for empty string", () => {
    expect(sanitizeString("")).toBeUndefined();
  });

  test("should return undefined for whitespace-only string", () => {
    expect(sanitizeString("   ")).toBeUndefined();
  });

  test("should trim whitespace from valid string", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });

  test("should return trimmed string as-is", () => {
    expect(sanitizeString("hello")).toBe("hello");
  });
});

// ============== isNonEmptyString Tests ==============

describe("isNonEmptyString", () => {
  test("should return true for non-empty string", () => {
    expect(isNonEmptyString("hello")).toBe(true);
  });

  test("should return true for string with spaces", () => {
    expect(isNonEmptyString("  hello  ")).toBe(true);
  });

  test("should return false for empty string", () => {
    expect(isNonEmptyString("")).toBe(false);
  });

  test("should return false for whitespace-only string", () => {
    expect(isNonEmptyString("   ")).toBe(false);
  });

  test("should return false for number", () => {
    expect(isNonEmptyString(123)).toBe(false);
  });

  test("should return false for null", () => {
    expect(isNonEmptyString(null)).toBe(false);
  });

  test("should return false for undefined", () => {
    expect(isNonEmptyString(undefined)).toBe(false);
  });

  test("should return false for object", () => {
    expect(isNonEmptyString({})).toBe(false);
  });
});

// ============== isValidDateRange Tests ==============

describe("isValidDateRange", () => {
  test("should return true when both dates are undefined", () => {
    expect(isValidDateRange(undefined, undefined)).toBe(true);
  });

  test("should return true when from is undefined", () => {
    expect(isValidDateRange(undefined, "2024-01-10")).toBe(true);
  });

  test("should return true when to is undefined", () => {
    expect(isValidDateRange("2024-01-01", undefined)).toBe(true);
  });

  test("should return true for valid date range", () => {
    expect(isValidDateRange("2024-01-01", "2024-01-10")).toBe(true);
  });

  test("should return true for same dates", () => {
    expect(isValidDateRange("2024-01-01", "2024-01-01")).toBe(true);
  });

  test("should return false when from is after to", () => {
    expect(isValidDateRange("2024-01-10", "2024-01-01")).toBe(false);
  });
});

// ============== isValidISODate Tests ==============

describe("isValidISODate", () => {
  test("should return true for valid ISO date", () => {
    expect(isValidISODate("2024-01-15")).toBe(true);
  });

  test("should return true for leap year date", () => {
    expect(isValidISODate("2024-02-29")).toBe(true);
  });

  test("should return false for invalid date", () => {
    expect(isValidISODate("2024-13-01")).toBe(false);
  });

  test("should return false for invalid format (ISO string)", () => {
    expect(isValidISODate("2024-01-15T10:30:00Z")).toBe(false);
  });

  test("should return false for invalid format (slash)", () => {
    expect(isValidISODate("2024/01/15")).toBe(false);
  });

  test("should return false for empty string", () => {
    expect(isValidISODate("")).toBe(false);
  });
});

// ============== isPositiveNumber Tests ==============

describe("isPositiveNumber", () => {
  test("should return true for positive integer", () => {
    expect(isPositiveNumber(5)).toBe(true);
  });

  test("should return true for positive float", () => {
    expect(isPositiveNumber(5.5)).toBe(true);
  });

  test("should return false for zero", () => {
    expect(isPositiveNumber(0)).toBe(false);
  });

  test("should return false for negative number", () => {
    expect(isPositiveNumber(-5)).toBe(false);
  });

  test("should return false for NaN", () => {
    expect(isPositiveNumber(NaN)).toBe(false);
  });

  test("should return false for Infinity", () => {
    expect(isPositiveNumber(Infinity)).toBe(false);
  });

  test("should return false for string", () => {
    expect(isPositiveNumber("5")).toBe(false);
  });

  test("should return false for null", () => {
    expect(isPositiveNumber(null)).toBe(false);
  });
});

// ============== isNonNegativeNumber Tests ==============

describe("isNonNegativeNumber", () => {
  test("should return true for positive integer", () => {
    expect(isNonNegativeNumber(5)).toBe(true);
  });

  test("should return true for zero", () => {
    expect(isNonNegativeNumber(0)).toBe(true);
  });

  test("should return false for negative number", () => {
    expect(isNonNegativeNumber(-5)).toBe(false);
  });

  test("should return false for NaN", () => {
    expect(isNonNegativeNumber(NaN)).toBe(false);
  });

  test("should return false for Infinity", () => {
    expect(isNonNegativeNumber(Infinity)).toBe(false);
  });

  test("should return false for string", () => {
    expect(isNonNegativeNumber("5")).toBe(false);
  });
});

// ============== Zod Schema Tests ==============

describe("BoxNameSchema", () => {
  test("should validate valid box name", async () => {
    const result = await BoxNameSchema.parseAsync("My Box");
    expect(result).toBe("My Box");
  });

  test("should trim whitespace", async () => {
    const result = await BoxNameSchema.parseAsync("  My Box  ");
    expect(result).toBe("My Box");
  });

  test("should reject empty string", async () => {
    expect(BoxNameSchema.safeParse("").success).toBe(false);
  });

  test("should reject name longer than 100 characters", async () => {
    const longName = "a".repeat(101);
    expect(BoxNameSchema.safeParse(longName).success).toBe(false);
  });

  test("should accept name with exactly 100 characters", async () => {
    const validName = "a".repeat(100);
    expect(BoxNameSchema.safeParse(validName).success).toBe(true);
  });
});

describe("BoxDescriptionSchema", () => {
  test("should validate valid description", async () => {
    const result = await BoxDescriptionSchema.parseAsync("A description");
    expect(result).toBe("A description");
  });

  test("should return undefined for empty string", async () => {
    const result = await BoxDescriptionSchema.parseAsync("");
    expect(result).toBeUndefined();
  });

  test("should return undefined for whitespace-only string", async () => {
    const result = await BoxDescriptionSchema.parseAsync("   ");
    expect(result).toBeUndefined();
  });

  test("should accept undefined", async () => {
    const result = await BoxDescriptionSchema.parseAsync(undefined);
    expect(result).toBeUndefined();
  });

  test("should reject description longer than 500 characters", async () => {
    const longDesc = "a".repeat(501);
    expect(BoxDescriptionSchema.safeParse(longDesc).success).toBe(false);
  });
});

describe("ColorHexSchema", () => {
  test("should validate 6-digit hex color", async () => {
    const result = await ColorHexSchema.parseAsync("#FFFFFF");
    expect(result).toBe("#FFFFFF");
  });

  test("should validate 3-digit hex color", async () => {
    const result = await ColorHexSchema.parseAsync("#FFF");
    expect(result).toBe("#FFF");
  });

  test("should validate lowercase hex color", async () => {
    const result = await ColorHexSchema.parseAsync("#ffffff");
    expect(result).toBe("#ffffff");
  });

  test("should accept undefined", async () => {
    const result = await ColorHexSchema.parseAsync(undefined);
    expect(result).toBeUndefined();
  });

  test("should reject invalid hex format", async () => {
    expect(ColorHexSchema.safeParse("FFFFFF").success).toBe(false);
  });

  test("should reject hex without hash", async () => {
    expect(ColorHexSchema.safeParse("FFF").success).toBe(false);
  });

  test("should reject invalid characters", async () => {
    expect(ColorHexSchema.safeParse("#GGG").success).toBe(false);
  });
});

describe("CurrencyCodeSchema", () => {
  test("should validate valid currency code", async () => {
    const result = await CurrencyCodeSchema.parseAsync("USD");
    expect(result).toBe("USD");
  });

  test("should convert to uppercase", async () => {
    const result = await CurrencyCodeSchema.parseAsync("usd");
    expect(result).toBe("USD");
  });

  test("should reject code with less than 3 characters", async () => {
    expect(CurrencyCodeSchema.safeParse("US").success).toBe(false);
  });

  test("should reject code with more than 3 characters", async () => {
    expect(CurrencyCodeSchema.safeParse("USDD").success).toBe(false);
  });
});

describe("PaginationParamsSchema", () => {
  test("should use defaults for empty input", async () => {
    const result = await PaginationParamsSchema.parseAsync({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  test("should coerce string numbers", async () => {
    const result = await PaginationParamsSchema.parseAsync({ page: "2", limit: "50" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  test("should reject non-positive page", async () => {
    expect(PaginationParamsSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(PaginationParamsSchema.safeParse({ page: -1 }).success).toBe(false);
  });

  test("should reject limit over 100", async () => {
    expect(PaginationParamsSchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  test("should reject non-positive limit", async () => {
    expect(PaginationParamsSchema.safeParse({ limit: 0 }).success).toBe(false);
  });
});
