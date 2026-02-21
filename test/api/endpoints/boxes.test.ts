/**
 * Tests for Box Endpoints
 */

import { describe, test, expect } from "bun:test";
import { BoxSchema, CreateBoxBodySchema, UpdateBoxBodySchema } from "@/api/dtos";

// ============== Box Schema Tests ==============

describe("BoxSchema", () => {
  test("should validate valid box", () => {
    const result = BoxSchema.safeParse({
      id: "box_1234567890_abc123",
      name: "My Box",
      count: 10,
      totalValue: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  });

  test("should validate box with optional fields", () => {
    const result = BoxSchema.safeParse({
      id: "box_1234567890_abc123",
      name: "My Box",
      description: "A test box",
      count: 0,
      totalValue: 0,
      currencyId: "cur_123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  });
});

describe("CreateBoxBodySchema", () => {
  test("should validate valid create input", () => {
    const result = CreateBoxBodySchema.safeParse({
      name: "New Box",
    });

    expect(result.success).toBe(true);
  });

  test("should validate create input with all fields", () => {
    const result = CreateBoxBodySchema.safeParse({
      name: "New Box",
      description: "A new box",
      metadata: { key: "value" },
    });

    expect(result.success).toBe(true);
  });

  test("should require name", () => {
    const result = CreateBoxBodySchema.safeParse({
      description: "A box without name",
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateBoxBodySchema", () => {
  test("should validate valid update input", () => {
    const result = UpdateBoxBodySchema.safeParse({
      name: "Updated Box",
    });

    expect(result.success).toBe(true);
  });

  test("should allow partial updates", () => {
    const result = UpdateBoxBodySchema.safeParse({
      description: "Updated description",
    });

    expect(result.success).toBe(true);
  });

  test("should allow empty update", () => {
    const result = UpdateBoxBodySchema.safeParse({});

    expect(result.success).toBe(true);
  });
});
