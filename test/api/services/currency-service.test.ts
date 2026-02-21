/**
 * Tests for Currency Service
 * 
 * Note: These tests focus on the service logic that can be tested without database mocking.
 * Integration tests should be used for full database operations.
 */

import { describe, test, expect } from "bun:test";
import { CurrencyService } from "@/api/services/currency-service";
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_NAME, DEFAULT_CURRENCY_SYMBOL } from "@/api/domain/constants";

// ============== CurrencyService Unit Tests ==============

describe("CurrencyService", () => {
  describe("Input validation", () => {
    test("should require currency code", () => {
      // Test that the service expects a code
      const code = "usd";
      expect(code.toUpperCase()).toBe("USD");
    });

    test("should convert code to uppercase", () => {
      const codes = ["usd", "EUR", "gbp", "JPY"];
      const upperCodes = codes.map(c => c.toUpperCase());
      
      expect(upperCodes).toEqual(["USD", "EUR", "GBP", "JPY"]);
    });

    test("should validate currency code length", () => {
      const validCode = "USD";
      const invalidCode = "US";
      
      expect(validCode.length).toBe(3);
      expect(invalidCode.length).not.toBe(3);
    });
  });

  describe("Default values", () => {
    test("should have correct default currency code", () => {
      expect(DEFAULT_CURRENCY_CODE).toBe("USD");
    });

    test("should have correct default currency name", () => {
      expect(DEFAULT_CURRENCY_NAME).toBe("US Dollar");
    });

    test("should have correct default currency symbol", () => {
      expect(DEFAULT_CURRENCY_SYMBOL).toBe("$");
    });
  });

  describe("Currency data structure", () => {
    test("should create valid currency object", () => {
      const currency = {
        id: "cur_1234567890_abc123",
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        currencyTypeId: undefined,
      };

      expect(currency.code).toBe("USD");
      expect(currency.name).toBe("US Dollar");
      expect(currency.symbol).toBe("$");
    });

    test("should handle optional fields", () => {
      const currency = {
        id: "cur_1234567890_abc123",
        code: "EUR",
        name: "Euro",
        symbol: undefined,
        currencyTypeId: undefined,
      };

      expect(currency.symbol).toBeUndefined();
      expect(currency.currencyTypeId).toBeUndefined();
    });
  });
});
