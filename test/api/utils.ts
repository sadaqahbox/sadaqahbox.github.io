/**
 * Test utilities and helpers
 */

import { beforeEach, afterEach, mock } from "bun:test";

// ============== Mock Database ==============

/**
 * Creates a mock database for testing
 */
export function createMockDb() {
  return {
    select: mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(() => Promise.resolve([])),
          orderBy: mock(() => Promise.resolve([])),
        })),
        orderBy: mock(() => Promise.resolve([])),
        limit: mock(() => Promise.resolve([])),
      })),
    })),
    insert: mock(() => ({
      values: mock(() => ({
        returning: mock(() => Promise.resolve([])),
        onConflictDoUpdate: mock(() => ({
          returning: mock(() => Promise.resolve([])),
        })),
      })),
    })),
    update: mock(() => ({
      set: mock(() => ({
        where: mock(() => ({
          returning: mock(() => Promise.resolve([])),
        })),
      })),
    })),
    delete: mock(() => ({
      where: mock(() => Promise.resolve([])),
    })),
    query: {
      boxes: {
        findMany: mock(() => Promise.resolve([])),
        findFirst: mock(() => Promise.resolve(null)),
      },
      sadaqahs: {
        findMany: mock(() => Promise.resolve([])),
        findFirst: mock(() => Promise.resolve(null)),
      },
      currencies: {
        findMany: mock(() => Promise.resolve([])),
        findFirst: mock(() => Promise.resolve(null)),
      },
    },
  };
}

// ============== Mock Context ==============

/**
 * Creates a mock Hono context for testing
 */
export function createMockContext(overrides: Partial<{
  body: unknown;
  query: Record<string, string>;
  params: Record<string, string>;
  headers: Record<string, string>;
  user: { id: string; email: string };
  method: string;
  path: string;
}> = {}) {
  const user = overrides.user ?? null;
  
  return {
    req: {
      json: () => Promise.resolve(overrides.body ?? {}),
      query: (key: string) => overrides.query?.[key] ?? undefined,
      param: (key: string) => overrides.params?.[key] ?? undefined,
      header: (key: string) => overrides.headers?.[key] ?? undefined,
      method: overrides.method ?? "GET",
      path: overrides.path ?? "/",
      url: `http://localhost${overrides.path ?? "/"}`,
      valid: () => overrides.body ?? {},
    },
    var: {
      user,
    },
    get: (key: string) => {
      if (key === "user") return user;
      return undefined;
    },
    set: mock(() => {}),
    json: mock((data: unknown, status?: number) => {
      return new Response(JSON.stringify(data), {
        status: status ?? 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
    status: mock((code: number) => code),
    header: mock(() => {}),
  } as unknown as any;
}

// ============== Test Data Factories ==============

/**
 * Creates a test box record
 */
export function createTestBox(overrides: Partial<{
  id: string;
  name: string;
  description: string | null;
  count: number;
  totalValue: number;
  currencyId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? "box_1234567890_abc123",
    name: overrides.name ?? "Test Box",
    description: overrides.description ?? null,
    metadata: null,
    count: overrides.count ?? 0,
    totalValue: overrides.totalValue ?? 0,
    currencyId: overrides.currencyId ?? null,
    userId: overrides.userId ?? "user_123",
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

/**
 * Creates a test currency record
 */
export function createTestCurrency(overrides: Partial<{
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  currencyTypeId: string | null;
  goldValue: number | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? "cur_1234567890_abc123",
    code: overrides.code ?? "USD",
    name: overrides.name ?? "US Dollar",
    symbol: overrides.symbol ?? "$",
    currencyTypeId: overrides.currencyTypeId ?? null,
    goldValue: overrides.goldValue ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

/**
 * Creates a test sadaqah record
 */
export function createTestSadaqah(overrides: Partial<{
  id: string;
  boxId: string;
  value: number;
  amount: number;
  currencyId: string;
  collectionId: string | null;
  createdAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? "sadaqah_1234567890_abc123",
    boxId: overrides.boxId ?? "box_1234567890_abc123",
    value: overrides.value ?? 1,
    amount: overrides.amount ?? 1,
    currencyId: overrides.currencyId ?? "cur_1234567890_abc123",
    collectionId: overrides.collectionId ?? null,
    createdAt: overrides.createdAt ?? new Date(),
  };
}

// ============== Assertion Helpers ==============

/**
 * Asserts that a response is a success response
 */
export function assertSuccessResponse(response: { success: boolean }) {
  if (response.success !== true) {
    throw new Error("Expected success response");
  }
}

/**
 * Asserts that a response is an error response
 */
export function assertErrorResponse(response: { success: boolean; error?: string }, expectedCode?: string) {
  if (response.success !== false) {
    throw new Error("Expected error response");
  }
  if (expectedCode && !response.error?.includes(expectedCode)) {
    throw new Error(`Expected error to contain "${expectedCode}", got "${response.error}"`);
  }
}

/**
 * Waits for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============== Test Environment Setup ==============

let originalEnv: Record<string, string | undefined> = {};

export function setupTestEnv(env: Record<string, string>) {
  originalEnv = {};
  for (const [key, value] of Object.entries(env)) {
    originalEnv[key] = process.env[key];
    process.env[key] = value;
  }
}

export function teardownTestEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
