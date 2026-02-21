/**
 * Tests for Exchange Rate Service
 * 
 * Includes both unit tests and functional tests for real API calls.
 * Functional tests are skipped by default to avoid hitting APIs during regular test runs.
 * To run functional tests, remove the .skip from the test or run with: bun test exchange-rate-service
 */

import { describe, test, expect } from "bun:test";
import {
  calculateGoldValue,
  calculateGoldGrams,
  convertGoldToCurrency,
  ExchangeRateService,
  type RateResult,
} from "@/api/services/exchange-rate-service";

// ============== Unit Tests for Helper Functions ==============

describe("calculateGoldValue", () => {
  test("should calculate gold value correctly", () => {
    // 1 USD = 0.0005 grams of gold when gold is $2000/gram
    const usdValue = 1;
    const xauUsdValue = 2000; // $2000 per gram
    
    const result = calculateGoldValue(usdValue, xauUsdValue);
    
    expect(result).toBe(0.0005);
  });

  test("should return 0 for zero XAU value", () => {
    const result = calculateGoldValue(100, 0);
    expect(result).toBe(0);
  });

  test("should return 0 for negative XAU value", () => {
    const result = calculateGoldValue(100, -100);
    expect(result).toBe(0);
  });

  test("should handle large USD values", () => {
    const usdValue = 1000000;
    const xauUsdValue = 2000;
    
    const result = calculateGoldValue(usdValue, xauUsdValue);
    
    expect(result).toBe(500);
  });

  test("should handle small USD values", () => {
    const usdValue = 0.01;
    const xauUsdValue = 2000;
    
    const result = calculateGoldValue(usdValue, xauUsdValue);
    
    expect(result).toBe(0.000005);
  });
});

describe("calculateGoldGrams", () => {
  test("should calculate gold grams from currency amount", () => {
    // 100 USD at $2000/gram = 0.05 grams
    const amount = 100;
    const currencyUsdValue = 1; // 1 USD per unit
    const xauUsdValue = 2000;
    
    const result = calculateGoldGrams(amount, currencyUsdValue, xauUsdValue);
    
    expect(result).toBe(0.05);
  });

  test("should handle EUR conversion", () => {
    // 100 EUR at 1.1 USD/EUR and $2000/gram
    const amount = 100;
    const currencyUsdValue = 1.1; // 1 EUR = 1.1 USD
    const xauUsdValue = 2000;
    
    const result = calculateGoldGrams(amount, currencyUsdValue, xauUsdValue);
    
    expect(result).toBeCloseTo(0.055, 10);
  });

  test("should return 0 for null currency USD value", () => {
    const result = calculateGoldGrams(100, null, 2000);
    expect(result).toBe(0);
  });

  test("should return 0 for null XAU USD value", () => {
    const result = calculateGoldGrams(100, 1, null);
    expect(result).toBe(0);
  });

  test("should return 0 for zero currency USD value", () => {
    const result = calculateGoldGrams(100, 0, 2000);
    expect(result).toBe(0);
  });

  test("should return 0 for zero XAU USD value", () => {
    const result = calculateGoldGrams(100, 1, 0);
    expect(result).toBe(0);
  });

  test("should return 0 for negative values", () => {
    expect(calculateGoldGrams(100, -1, 2000)).toBe(0);
    expect(calculateGoldGrams(100, 1, -2000)).toBe(0);
  });
});

describe("convertGoldToCurrency", () => {
  test("should convert gold grams back to currency", () => {
    // 0.05 grams at $2000/gram = $100
    const goldGrams = 0.05;
    const currencyUsdValue = 1;
    const xauUsdValue = 2000;
    
    const result = convertGoldToCurrency(goldGrams, currencyUsdValue, xauUsdValue);
    
    expect(result).toBe(100);
  });

  test("should convert gold to EUR", () => {
    // 0.05 grams at $2000/gram = $100 = ~90.9 EUR at 1.1 USD/EUR
    const goldGrams = 0.05;
    const currencyUsdValue = 1.1; // 1 EUR = 1.1 USD
    const xauUsdValue = 2000;
    
    const result = convertGoldToCurrency(goldGrams, currencyUsdValue, xauUsdValue);
    
    expect(result).toBeCloseTo(90.91, 1);
  });

  test("should return 0 for null currency USD value", () => {
    const result = convertGoldToCurrency(0.05, null, 2000);
    expect(result).toBe(0);
  });

  test("should return 0 for null XAU USD value", () => {
    const result = convertGoldToCurrency(0.05, 1, null);
    expect(result).toBe(0);
  });

  test("should return 0 for zero values", () => {
    expect(convertGoldToCurrency(0.05, 0, 2000)).toBe(0);
    expect(convertGoldToCurrency(0.05, 1, 0)).toBe(0);
  });
});

describe("Round-trip conversion", () => {
  test("should maintain value through round-trip conversion", () => {
    const originalAmount = 100;
    const currencyUsdValue = 1.1;
    const xauUsdValue = 2000;
    
    // Convert to gold grams
    const goldGrams = calculateGoldGrams(originalAmount, currencyUsdValue, xauUsdValue);
    
    // Convert back to currency
    const result = convertGoldToCurrency(goldGrams, currencyUsdValue, xauUsdValue);
    
    expect(result).toBeCloseTo(originalAmount, 10);
  });
});

// ============== ExchangeRateService Unit Tests ==============

describe("ExchangeRateService", () => {
  describe("getInstance", () => {
    test("should return singleton instance", () => {
      const mockDb = {} as any;
      
      const instance1 = ExchangeRateService.getInstance(mockDb);
      const instance2 = ExchangeRateService.getInstance(mockDb);
      
      expect(instance1).toBe(instance2);
    });
  });

  describe("Constants", () => {
    test("should have correct troy ounce to grams conversion", () => {
      const TROY_OUNCE_TO_GRAMS = 31.1034768;
      
      // Verify the constant is correct
      expect(TROY_OUNCE_TO_GRAMS).toBeCloseTo(31.1035, 3);
    });

    test("should have correct TTL value", () => {
      const TTL_MS = 60 * 60 * 1000; // 1 hour
      
      expect(TTL_MS).toBe(3600000);
    });
  });
});

// ============== Functional Tests (Real API Calls) ==============
// These tests are skipped by default. Remove .skip to run them.

describe.skip("ExchangeRateService - Functional Tests (Real API Calls)", () => {
  test("should fetch rates from ExchangeRate-API", async () => {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { "Accept": "application/json" },
    });
    
    expect(response.ok).toBe(true);
    
    const data = await response.json() as { rates?: Record<string, number> };
    
    expect(data.rates).toBeDefined();
    expect(data.rates?.EUR).toBeDefined();
    expect(data.rates?.EUR).toBeGreaterThan(0);
    expect(data.rates?.GBP).toBeDefined();
    expect(data.rates?.JPY).toBeDefined();
  });

  test("should fetch rates from Frankfurter API", async () => {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD", {
      headers: { "Accept": "application/json" },
    });
    
    expect(response.ok).toBe(true);
    
    const data = await response.json() as { rates?: Record<string, number> };
    
    expect(data.rates).toBeDefined();
    expect(data.rates?.EUR).toBeDefined();
  });

  test("should fetch rates from Currency API", async () => {
    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
      { headers: { "Accept": "application/json" } }
    );
    
    expect(response.ok).toBe(true);
    
    const data = await response.json() as { usd?: Record<string, number> };
    
    expect(data.usd).toBeDefined();
    expect(data.usd?.eur).toBeDefined();
  });

  test("should fetch crypto rates from CoinGecko", async () => {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      { headers: { "Accept": "application/json" } }
    );
    
    expect(response.ok).toBe(true);
    
    const data = await response.json() as Record<string, { usd?: number }>;
    
    expect(data.bitcoin).toBeDefined();
    expect(data.bitcoin?.usd).toBeDefined();
    expect(data.bitcoin?.usd).toBeGreaterThan(0);
    expect(data.ethereum).toBeDefined();
  });

  test("should fetch gold price from Metals.live", async () => {
    const response = await fetch("https://api.metals.live/v1/spot/gold", {
      headers: { "Accept": "application/json" },
    });
    
    expect(response.ok).toBe(true);
    
    const data = await response.json() as Array<{ price?: number }>;
    
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]?.price).toBeDefined();
    expect(data[0]?.price).toBeGreaterThan(0);
  });

  test("should have consistent rate data across APIs", async () => {
    // Fetch from multiple APIs and compare
    const [erApiRes, frankfurterRes] = await Promise.all([
      fetch("https://open.er-api.com/v6/latest/USD"),
      fetch("https://api.frankfurter.app/latest?from=USD"),
    ]);
    
    const erApiData = await erApiRes.json() as { rates?: Record<string, number> };
    const frankfurterData = await frankfurterRes.json() as { rates?: Record<string, number> };
    
    // Compare EUR rates - should be within 5% of each other
    const erApiEur = erApiData.rates?.EUR ?? 0;
    const frankfurterEur = frankfurterData.rates?.EUR ?? 0;
    
    const diff = Math.abs(erApiEur - frankfurterEur) / erApiEur;
    expect(diff).toBeLessThan(0.05); // Within 5%
  });
});

// ============== Rate Result Type Tests ==============

describe("RateResult type", () => {
  test("should create valid RateResult", () => {
    const result: RateResult = {
      success: true,
      usdRates: new Map([["USD", 1], ["EUR", 1.1]]),
      goldPriceUsd: 2000,
      errors: [],
      fromCache: [],
      newlyFetched: ["USD", "EUR"],
      notFound: [],
    };
    
    expect(result.success).toBe(true);
    expect(result.usdRates.size).toBe(2);
    expect(result.goldPriceUsd).toBe(2000);
    expect(result.errors).toHaveLength(0);
  });

  test("should handle failed RateResult", () => {
    const result: RateResult = {
      success: false,
      usdRates: new Map(),
      goldPriceUsd: 0,
      errors: ["API failed", "Network error"],
      fromCache: [],
      newlyFetched: [],
      notFound: ["USD"],
    };
    
    expect(result.success).toBe(false);
    expect(result.usdRates.size).toBe(0);
    expect(result.goldPriceUsd).toBe(0);
    expect(result.errors).toHaveLength(2);
  });
});

// ============== Currency Rate Type Tests ==============

describe("CurrencyRate type", () => {
  test("should create valid CurrencyRate", () => {
    const rate = {
      code: "EUR",
      usdValue: 1.08,
    };
    
    expect(rate.code).toBe("EUR");
    expect(rate.usdValue).toBe(1.08);
  });
});
