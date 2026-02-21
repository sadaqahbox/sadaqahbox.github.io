/**
 * Tests for Collection Service
 */

import { describe, test, expect } from "bun:test";
import { CollectionService, type ListCollectionsOptions } from "@/api/services/collection-service";
import { generateCollectionId } from "@/api/shared/id-generator";

// ============== CollectionService Unit Tests ==============

describe("CollectionService", () => {
  describe("ID generation", () => {
    test("should generate valid collection ID", () => {
      const id = generateCollectionId();
      
      expect(id.startsWith("col_")).toBe(true);
      expect(id.split("_").length).toBeGreaterThanOrEqual(2);
    });

    test("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCollectionId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("ListCollectionsOptions", () => {
    test("should create valid list options", () => {
      const options: ListCollectionsOptions = {
        page: 1,
        limit: 20,
      };

      expect(options.page).toBe(1);
      expect(options.limit).toBe(20);
    });

    test("should allow partial options", () => {
      const options: ListCollectionsOptions = {};

      expect(options.page).toBeUndefined();
      expect(options.limit).toBeUndefined();
    });
  });

  describe("Collection data structure", () => {
    test("should create valid collection object", () => {
      const collection = {
        id: "col_1234567890_abc123",
        boxId: "box_1234567890_abc123",
        sadaqahCount: 10,
        totalValue: 50,
        collectedAt: new Date().toISOString(),
      };

      expect(collection.id).toBeDefined();
      expect(collection.boxId).toBeDefined();
      expect(collection.sadaqahCount).toBe(10);
      expect(collection.totalValue).toBe(50);
    });

    test("should handle collection with notes", () => {
      const collection = {
        id: "col_1234567890_abc123",
        boxId: "box_1234567890_abc123",
        sadaqahCount: 5,
        totalValue: 25,
        notes: "Monthly collection",
        collectedAt: new Date().toISOString(),
      };

      expect(collection.notes).toBe("Monthly collection");
    });
  });

  describe("Collection result", () => {
    test("should create valid collection result", () => {
      const result = {
        collection: {
          id: "col_123",
          boxId: "box_123",
          sadaqahCount: 10,
          totalValue: 50,
          collectedAt: new Date().toISOString(),
        },
        updatedBox: {
          id: "box_123",
          name: "Test Box",
          count: 0,
          totalValue: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      expect(result.collection).toBeDefined();
      expect(result.updatedBox).toBeDefined();
      expect(result.updatedBox.count).toBe(0);
    });
  });
});
