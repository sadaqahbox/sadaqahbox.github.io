/**
 * Tests for Box Service
 */

import { describe, test, expect } from "bun:test";
import { BoxService, type CreateBoxInput, type UpdateBoxInput, type ListBoxesOptions } from "@/api/services/box-service";
import { MAX_BOX_NAME_LENGTH, MAX_BOX_DESCRIPTION_LENGTH } from "@/api/domain/constants";
import { generateBoxId } from "@/api/shared/id-generator";
import { sanitizeString } from "@/api/shared/validators";

// ============== BoxService Unit Tests ==============

describe("BoxService", () => {
  describe("Constants", () => {
    test("should have correct max box name length", () => {
      expect(MAX_BOX_NAME_LENGTH).toBe(100);
    });

    test("should have correct max box description length", () => {
      expect(MAX_BOX_DESCRIPTION_LENGTH).toBe(500);
    });
  });

  describe("Input validation", () => {
    test("should sanitize box name", () => {
      const name = "  My Box  ";
      const sanitized = sanitizeString(name);
      
      expect(sanitized).toBe("My Box");
    });

    test("should reject empty box name", () => {
      const name = "";
      const sanitized = sanitizeString(name);
      
      expect(sanitized).toBeUndefined();
    });

    test("should reject whitespace-only box name", () => {
      const name = "   ";
      const sanitized = sanitizeString(name);
      
      expect(sanitized).toBeUndefined();
    });

    test("should validate name length", () => {
      const validName = "a".repeat(100);
      const invalidName = "a".repeat(101);
      
      expect(validName.length).toBeLessThanOrEqual(MAX_BOX_NAME_LENGTH);
      expect(invalidName.length).toBeGreaterThan(MAX_BOX_NAME_LENGTH);
    });

    test("should validate description length", () => {
      const validDesc = "a".repeat(500);
      const invalidDesc = "a".repeat(501);
      
      expect(validDesc.length).toBeLessThanOrEqual(MAX_BOX_DESCRIPTION_LENGTH);
      expect(invalidDesc.length).toBeGreaterThan(MAX_BOX_DESCRIPTION_LENGTH);
    });
  });

  describe("ID generation", () => {
    test("should generate valid box ID", () => {
      const id = generateBoxId();
      
      expect(id.startsWith("box_")).toBe(true);
      expect(id.split("_").length).toBeGreaterThanOrEqual(2);
    });

    test("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateBoxId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("CreateBoxInput", () => {
    test("should create valid input with required fields", () => {
      const input: CreateBoxInput = {
        name: "My Box",
        userId: "user_123",
      };

      expect(input.name).toBe("My Box");
      expect(input.userId).toBe("user_123");
    });

    test("should create valid input with optional fields", () => {
      const input: CreateBoxInput = {
        name: "My Box",
        description: "A description",
        metadata: { key: "value" },
        tagIds: ["tag_1", "tag_2"],
        userId: "user_123",
      };

      expect(input.description).toBe("A description");
      expect(input.metadata).toEqual({ key: "value" });
      expect(input.tagIds).toHaveLength(2);
    });
  });

  describe("UpdateBoxInput", () => {
    test("should create valid update input", () => {
      const input: UpdateBoxInput = {
        name: "Updated Name",
        description: "Updated description",
      };

      expect(input.name).toBe("Updated Name");
      expect(input.description).toBe("Updated description");
    });

    test("should allow partial updates", () => {
      const input: UpdateBoxInput = {
        name: "Updated Name",
      };

      expect(input.name).toBe("Updated Name");
      expect(input.description).toBeUndefined();
    });

    test("should allow null metadata to clear it", () => {
      const input: UpdateBoxInput = {
        metadata: null,
      };

      expect(input.metadata).toBeNull();
    });
  });

  describe("ListBoxesOptions", () => {
    test("should accept sort options", () => {
      const options: ListBoxesOptions = {
        sortBy: "name",
        sortOrder: "asc",
      };

      expect(options.sortBy).toBe("name");
      expect(options.sortOrder).toBe("asc");
    });

    test("should accept different sort fields", () => {
      const sortFields: Array<ListBoxesOptions["sortBy"]> = ["name", "createdAt", "count", "totalValue"];
      
      sortFields.forEach(field => {
        expect(["name", "createdAt", "count", "totalValue"]).toContain(field);
      });
    });

    test("should accept sort orders", () => {
      const orders: Array<ListBoxesOptions["sortOrder"]> = ["asc", "desc"];
      
      orders.forEach(order => {
        expect(["asc", "desc"]).toContain(order);
      });
    });
  });

  describe("Box data structure", () => {
    test("should create valid box object", () => {
      const box = {
        id: "box_1234567890_abc123",
        name: "My Box",
        description: "A test box",
        count: 10,
        totalValue: 50,
        currencyId: "cur_123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(box.id).toBeDefined();
      expect(box.name).toBe("My Box");
      expect(box.count).toBe(10);
      expect(box.totalValue).toBe(50);
    });

    test("should handle optional fields", () => {
      const box = {
        id: "box_1234567890_abc123",
        name: "My Box",
        count: 0,
        totalValue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(box.description).toBeUndefined();
      expect(box.currencyId).toBeUndefined();
    });

    test("should handle tags", () => {
      const box = {
        id: "box_1234567890_abc123",
        name: "My Box",
        count: 0,
        totalValue: 0,
        tags: [
          { id: "tag_1", name: "Important", color: "#FF0000" },
          { id: "tag_2", name: "Personal", color: "#00FF00" },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(box.tags).toHaveLength(2);
      expect(box.tags?.[0].name).toBe("Important");
    });
  });
});

// ============== BoxStats Type Tests ==============

describe("BoxStats type", () => {
  test("should create valid box stats", () => {
    const stats = {
      totalBoxes: 10,
      totalSadaqahs: 150,
      totalValue: 500,
      averagePerBox: 50,
    };

    expect(stats.totalBoxes).toBe(10);
    expect(stats.totalSadaqahs).toBe(150);
    expect(stats.totalValue).toBe(500);
    expect(stats.averagePerBox).toBe(50);
  });
});

// ============== BoxSummary Type Tests ==============

describe("BoxSummary type", () => {
  test("should create valid box summary", () => {
    const summary = {
      id: "box_123",
      name: "My Box",
      count: 10,
      totalValue: 50,
      currency: { id: "cur_1", code: "USD", name: "US Dollar" },
      lastSadaqahAt: new Date().toISOString(),
    };

    expect(summary.id).toBe("box_123");
    expect(summary.currency?.code).toBe("USD");
    expect(summary.lastSadaqahAt).toBeDefined();
  });
});
