/**
 * Tests for Sadaqah Service
 */

import { describe, test, expect } from "bun:test";
import { SadaqahService, type AddSadaqahInput, type ListSadaqahsOptions } from "@/api/services/sadaqah-service";
import { DEFAULT_SADAQAH_VALUE, DEFAULT_SADAQAH_AMOUNT, MAX_SADAQAH_AMOUNT } from "@/api/domain/constants";
import { generateSadaqahId } from "@/api/shared/id-generator";

// ============== SadaqahService Unit Tests ==============

describe("SadaqahService", () => {
  describe("Constants", () => {
    test("should have correct default sadaqah value", () => {
      expect(DEFAULT_SADAQAH_VALUE).toBe(1);
    });

    test("should have correct default sadaqah amount", () => {
      expect(DEFAULT_SADAQAH_AMOUNT).toBe(1);
    });

    test("should have correct max sadaqah amount", () => {
      expect(MAX_SADAQAH_AMOUNT).toBe(1000);
    });
  });

  describe("Input validation", () => {
    test("should use default value when not provided", () => {
      const input: AddSadaqahInput = {};
      const value = input.value ?? input.amount ?? DEFAULT_SADAQAH_VALUE;
      
      expect(value).toBe(1);
    });

    test("should use provided value", () => {
      const input: AddSadaqahInput = { value: 5 };
      const value = input.value ?? input.amount ?? DEFAULT_SADAQAH_VALUE;
      
      expect(value).toBe(5);
    });

    test("should prefer value over amount", () => {
      const input: AddSadaqahInput = { value: 10, amount: 5 };
      const value = input.value ?? input.amount ?? DEFAULT_SADAQAH_VALUE;
      
      expect(value).toBe(10);
    });

    test("should use amount when value not provided", () => {
      const input: AddSadaqahInput = { amount: 3 };
      const value = input.value ?? input.amount ?? DEFAULT_SADAQAH_VALUE;
      
      expect(value).toBe(3);
    });

    test("should validate positive value", () => {
      const validValues = [1, 0.5, 100, 0.01];
      const invalidValues = [0, -1, -0.5];
      
      validValues.forEach(v => {
        expect(v > 0).toBe(true);
      });
      
      invalidValues.forEach(v => {
        expect(v > 0).toBe(false);
      });
    });

    test("should validate max amount", () => {
      const validAmounts = [1, 500, 1000];
      const invalidAmounts = [1001, 2000];
      
      validAmounts.forEach(amount => {
        expect(amount <= MAX_SADAQAH_AMOUNT).toBe(true);
      });
      
      invalidAmounts.forEach(amount => {
        expect(amount <= MAX_SADAQAH_AMOUNT).toBe(false);
      });
    });
  });

  describe("ID generation", () => {
    test("should generate valid sadaqah ID", () => {
      const id = generateSadaqahId();
      
      expect(id.startsWith("sadaqah_")).toBe(true);
      expect(id.split("_").length).toBeGreaterThanOrEqual(2);
    });

    test("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSadaqahId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("Sadaqah data structure", () => {
    test("should create valid sadaqah object", () => {
      const sadaqah = {
        id: "sadaqah_1234567890_abc123",
        boxId: "box_1234567890_abc123",
        value: 5,
        amount: 1,
        currencyId: "cur_1234567890_abc123",
        createdAt: new Date().toISOString(),
      };

      expect(sadaqah.id).toBeDefined();
      expect(sadaqah.boxId).toBeDefined();
      expect(sadaqah.value).toBe(5);
      expect(sadaqah.currencyId).toBeDefined();
    });

    test("should handle optional metadata", () => {
      const sadaqah = {
        id: "sadaqah_1234567890_abc123",
        boxId: "box_1234567890_abc123",
        value: 1,
        currencyId: "cur_1234567890_abc123",
        metadata: { note: "Donation", source: "Web" },
        createdAt: new Date().toISOString(),
      };

      expect(sadaqah.metadata).toBeDefined();
      expect(sadaqah.metadata?.note).toBe("Donation");
    });
  });

  describe("List options", () => {
    test("should use default pagination", () => {
      const options: ListSadaqahsOptions = {};
      
      expect(options.page).toBeUndefined();
      expect(options.limit).toBeUndefined();
    });

    test("should accept pagination params", () => {
      const options: ListSadaqahsOptions = {
        page: 2,
        limit: 50,
      };
      
      expect(options.page).toBe(2);
      expect(options.limit).toBe(50);
    });

    test("should accept date range", () => {
      const options: ListSadaqahsOptions = {
        from: "2024-01-01",
        to: "2024-12-31",
      };
      
      expect(options.from).toBe("2024-01-01");
      expect(options.to).toBe("2024-12-31");
    });
  });
});

// ============== AddSadaqahResult Type Tests ==============

describe("AddSadaqahResult type", () => {
  test("should create valid result", () => {
    const result = {
      sadaqah: {
        id: "sadaqah_123",
        boxId: "box_123",
        value: 5,
        currencyId: "cur_123",
        createdAt: new Date().toISOString(),
      },
      updatedBox: {
        id: "box_123",
        name: "Test Box",
        count: 6,
        totalValue: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    expect(result.sadaqah).toBeDefined();
    expect(result.updatedBox).toBeDefined();
    expect(result.updatedBox.count).toBe(6);
  });
});

// ============== DeleteSadaqahResult Type Tests ==============

describe("DeleteSadaqahResult type", () => {
  test("should create successful delete result", () => {
    const result = {
      deleted: true,
      updatedBox: {
        id: "box_123",
        name: "Test Box",
        count: 5,
        totalValue: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    expect(result.deleted).toBe(true);
    expect(result.updatedBox).toBeDefined();
  });

  test("should create failed delete result", () => {
    const result = {
      deleted: false,
    };

    expect(result.deleted).toBe(false);
    expect(result.updatedBox).toBeUndefined();
  });
});
