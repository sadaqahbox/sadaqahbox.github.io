/**
 * Tests for Tag Endpoints
 */

import { describe, test, expect } from "bun:test";
import { TagSchema, CreateTagBodySchema } from "@/api/dtos";

// ============== Tag Schema Tests ==============

describe("TagSchema", () => {
  test("should validate valid tag", () => {
    const result = TagSchema.safeParse({
      id: "tag_1234567890_abc123",
      name: "Important",
      color: "#FF0000",
      createdAt: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  });

  test("should validate tag without color", () => {
    const result = TagSchema.safeParse({
      id: "tag_1234567890_abc123",
      name: "Personal",
      createdAt: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  });
});

describe("CreateTagBodySchema", () => {
  test("should validate valid create input", () => {
    const result = CreateTagBodySchema.safeParse({
      name: "New Tag",
    });

    expect(result.success).toBe(true);
  });

  test("should validate create input with color", () => {
    const result = CreateTagBodySchema.safeParse({
      name: "New Tag",
      color: "#00FF00",
    });

    expect(result.success).toBe(true);
  });

  test("should require name", () => {
    const result = CreateTagBodySchema.safeParse({
      color: "#FF0000",
    });

    expect(result.success).toBe(false);
  });
});
