import { drizzle } from "drizzle-orm/d1";
import type { Context } from "hono";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

declare module "hono" {
  interface ContextVariableMap {
    db: Database;
  }
}

/**
 * Creates a new Drizzle database instance with D1
 * Note: In most cases, use getDbFromContext instead to reuse instances
 */
export function createDatabase(d1Database: D1Database) {
  return drizzle(d1Database, { schema });
}

/**
 * Gets or creates a database instance from the Hono context
 * This ensures the same instance is reused within a request
 */
export function getDbFromContext(c: Context<{ Bindings: Env }>): Database {
  let db = c.get("db");
  if (!db) {
    db = createDatabase(c.env.DB);
    c.set("db", db);
  }
  return db;
}

export { schema };
