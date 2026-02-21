/**
 * Base Entity Class
 *
 * Provides common CRUD operations for entities to reduce duplication.
 * Uses Drizzle ORM's typed table definitions for type safety.
 */

import { eq, desc, asc, count, sql, type SQL } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { Database } from "../../db";

export interface BaseEntityOptions {
    id: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface ListOptions {
    limit?: number;
    offset?: number;
    orderBy?: "asc" | "desc";
}

/**
 * Base entity class with common CRUD operations
 *
 * @example
 * ```typescript
 * class MyEntity extends BaseEntity<MyType, MyCreateInput> {
 *   constructor(db: Database) {
 *     super(db, myTable, 'id');
 *   }
 *   // Override methods as needed
 * }
 * ```
 */
export class BaseEntity<
    T extends BaseEntityOptions,
    CreateInput extends Record<string, unknown>
> {
    constructor(
        protected db: Database,
        protected table: SQLiteTable,
        protected idColumn: string = "id"
    ) {}

    /**
     * Get a single item by ID
     */
    async get(id: string): Promise<T | null> {
        const result = await this.db
            .select()
            .from(this.table)
            .where(sql`${this.table}.${sql.raw(this.idColumn)} = ${id}`)
            .limit(1);
        return (result[0] as T | undefined) ?? null;
    }

    /**
     * List all items (optionally filtered by user) with pagination
     */
    async list(
        userId?: string,
        userIdColumn: string = "userId",
        options: ListOptions = {}
    ): Promise<{ items: T[]; total: number; hasMore: boolean }> {
        const { limit = 50, offset = 0, orderBy = "desc" } = options;

        // Build count query
        const countQuery = this.db
            .select({ count: count() })
            .from(this.table);

        if (userId) {
            countQuery.where(sql`${this.table}.${sql.raw(userIdColumn)} = ${userId}`);
        }

        const totalResult = await countQuery;
        const total = totalResult[0]?.count ?? 0;

        // Build data query
        let dataQuery = this.db.select().from(this.table);

        if (userId) {
            dataQuery = dataQuery.where(
                sql`${this.table}.${sql.raw(userIdColumn)} = ${userId}`
            ) as typeof dataQuery;
        }

        // Apply ordering
        const orderColumn = sql`${this.table}.${sql.raw("createdAt")}`;
        const orderFn = orderBy === "asc" ? asc : desc;

        const items = await dataQuery
            .orderBy(orderFn(orderColumn))
            .limit(limit)
            .offset(offset) as T[];

        return {
            items,
            total,
            hasMore: offset + items.length < total
        };
    }

    /**
     * Delete an item by ID
     */
    async delete(id: string): Promise<boolean> {
        const result = await this.db
            .delete(this.table)
            .where(sql`${this.table}.${sql.raw(this.idColumn)} = ${id}`)
            .returning();
        return result.length > 0;
    }

    /**
     * Check if an item exists
     */
    async exists(id: string): Promise<boolean> {
        const item = await this.get(id);
        return item !== null;
    }
}
