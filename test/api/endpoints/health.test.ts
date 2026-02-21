/**
 * Tests for Health endpoints
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { healthHandler } from "@/api/endpoints/health";
import { createMockContext } from "../utils";

// ============== Health Endpoint Tests ==============

describe("Health Endpoint", () => {
  describe("healthHandler", () => {
    test("should return healthy status", async () => {
      const mockContext = createMockContext();
      
      const response = await healthHandler(mockContext);
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.status).toBe("healthy");
      expect(body.version).toBe("1.0.0");
      expect(body.timestamp).toBeDefined();
    });

    test("should return valid ISO timestamp", async () => {
      const mockContext = createMockContext();
      
      const response = await healthHandler(mockContext);
      const body = await response.json();
      
      const timestamp = new Date(body.timestamp);
      expect(timestamp.toISOString()).toBe(body.timestamp);
    });

    test("should return 200 status code", async () => {
      const mockContext = createMockContext();
      
      const response = await healthHandler(mockContext);
      
      expect(response.status).toBe(200);
    });

    test("should return JSON content type", async () => {
      const mockContext = createMockContext();
      
      const response = await healthHandler(mockContext);
      
      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });
});
