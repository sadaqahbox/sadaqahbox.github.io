/**
 * Base Entity Class
 * 
 * Provides common CRUD operations for entities to reduce duplication.
 * This is a simplified base class that uses looser typing to work with Drizzle ORM.
 */

import { eq, and, desc } from "drizzle-orm";
import type { Database } from "../../db";

export interface BaseEntityOptions {
    id: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
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
 *   
 *   // Override methods as needed
 * }
 * ```
 */
export class BaseEntity<T extends BaseEntityOptions, CreateInput extends Record<string, unknown>> {
    constructor(
        protected db: Database,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        protected table: any,
        protected idColumn: string = "id"
    ) {}

    /**
     * Get a single item by ID
     */
    async get(id: string): Promise<T | null> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any[] = await this.db
            .select()
            .from(this.table)
            .where(eq(this.table[this.idColumn], id))
            .limit(1);
        return result[0] as T | null;
    }

    /**
     * List all items (optionally filtered by user)
     */
    async list(userId?: string, userIdColumn: string = "userId"): Promise<T[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query: any = this.db.select().from(this.table);
        
        if (userId) {
            query = query.where(eq(this.table[userIdColumn], userId));
        }
        
        const result = await query.orderBy(desc(this.table.createdAt));
        return result as T[];
    }

    /**
     * Delete an item by ID
     */
    async delete(id: string): Promise<boolean> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await this.db
            .delete(this.table)
            .where(eq(this.table[this.idColumn], id));
        return (result.rowCount ?? result.changes) > 0;
    }

    /**
     * Check if an item exists
     */
    async exists(id: string): Promise<boolean> {
        const item = await this.get(id);
        return item !== null;
    }
}
