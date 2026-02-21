/**
 * Tests for Currency Endpoints
 */

import { describe, test, expect } from "bun:test";
import { z } from "@hono/zod-openapi";
import { CurrencySchema, CreateCurrencyBodySchema } from "@/api/dtos";

// ============== Currency Schema Tests ==============

describe("CurrencySchema", () => {
  test("should validate valid currency", () => {
    const result = CurrencySchema.safeParse({
      id: "cur_1234567890_abc123",
      code: "USD",
      name: "US Dollar",
      symbol: "$",
    });

    expect(result.success).toBe(true);
  });

  test("should validate currency without optional fields", () => {
    const result = CurrencySchema.safeParse({
      id: "cur_1234567890_abc123",
      code: "EUR",
      name: "Euro",
    });

    expect(result.success).toBe(true);
  });
});

describe("CreateCurrencyBodySchema", () => {
  test("should validate valid create input", () => {
    const result = CreateCurrencyBodySchema.safeParse({
      code: "GBP",
      name: "British Pound",
      symbol: "£",
    });

    expect(result.success).toBe(true);
  });

  test("should require code and name", () => {
    const result = CreateCurrencyBodySchema.safeParse({
      symbol: "£",
    });

    expect(result.success).toBe(false);
  });

  test("should accept optional fields", () => {
    const result = CreateCurrencyBodySchema.safeParse({
      code: "BTC",
      name: "Bitcoin",
      symbol: "₿",
      currencyTypeId: "ctyp_crypto",
      usdValue: 45000,
    });

    expect(result.success).toBe(true);
  });
});
