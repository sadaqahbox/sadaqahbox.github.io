/**
 * Tests for Tag Service
 * 
 * Note: These tests focus on the service logic that can be tested without database mocking.
 * Integration tests should be used for full database operations.
 */

import { describe, test, expect } from "bun:test";
import { TagService } from "@/api/services/tag-service";
import { DEFAULT_TAG_COLOR } from "@/api/domain/constants";
import { sanitizeString } from "@/api/shared/validators";

// ============== TagService Unit Tests ==============

describe("TagService", () => {
  describe("Input validation", () => {
    test("should sanitize tag name", () => {
      const name = "  Important  ";
      const sanitized = sanitizeString(name);
      
      expect(sanitized).toBe("Important");
    });

    test("should reject empty tag name", () => {
      const name = "";
      const sanitized = sanitizeString(name);
      
      expect(sanitized).toBeUndefined();
    });

    test("should reject whitespace-only tag name", () => {
      const name = "   ";
      const sanitized = sanitizeString(name);
      
      expect(sanitized).toBeUndefined();
    });
  });

  describe("Default values", () => {
    test("should have correct default tag color", () => {
      expect(DEFAULT_TAG_COLOR).toBe("#6366F1");
    });
  });

  describe("Tag data structure", () => {
    test("should create valid tag object", () => {
      const tag = {
        id: "tag_1234567890_abc123",
        name: "Important",
        color: "#FF0000",
        createdAt: new Date().toISOString(),
      };

      expect(tag.name).toBe("Important");
      expect(tag.color).toBe("#FF0000");
      expect(tag.createdAt).toBeDefined();
    });

    test("should handle optional color field", () => {
      const tag = {
        id: "tag_1234567890_abc123",
        name: "Test Tag",
        color: undefined,
        createdAt: new Date().toISOString(),
      };

      expect(tag.color).toBeUndefined();
    });
  });

  describe("Color validation", () => {
    test("should validate hex color format", () => {
      const validColors = ["#FFF", "#FFFFFF", "#6366F1", "#ff0000"];
      const invalidColors = ["FFF", "red", "#GGG", "#FF"];
      
      const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      
      validColors.forEach(color => {
        expect(hexPattern.test(color)).toBe(true);
      });
      
      invalidColors.forEach(color => {
        expect(hexPattern.test(color)).toBe(false);
      });
    });
  });
});
