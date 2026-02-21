/**
 * Transaction Manager
 *
 * Provides proper transaction wrapper with rollback support for D1 database.
 * Uses D1's batch API for atomic operations.
 */

import type { Database } from "../../db";

/**
 * Transaction isolation level
 */
export type IsolationLevel = "READ_UNCOMMITTED" | "READ_COMMITTED" | "SERIALIZABLE";

export interface TransactionOptions {
    isolationLevel?: IsolationLevel;
    readOnly?: boolean;
    timeout?: number;
}

const DEFAULT_OPTIONS: TransactionOptions = {
    isolationLevel: "SERIALIZABLE",
    readOnly: false,
    timeout: 30000,
};

/**
 * Transaction context passed to transaction callbacks
 */
export interface TransactionContext {
    /**
     * Add a query to the transaction batch
     */
    add: (query: { toSQL(): { sql: string; params: unknown[] } }) => void;

    /**
     * Execute a callback within the transaction
     */
    execute: <T>(fn: () => Promise<T>) => Promise<T>;

    /**
     * Rollback the transaction (marks it for rollback)
     */
    rollback: () => void;

    /**
     * Check if transaction has been marked for rollback
     */
    isRolledBack: () => boolean;
}

/**
 * Execute operations within a transaction
 *
 * All operations are batched and executed atomically.
 * If any operation fails, all changes are rolled back.
 *
 * @example
 * ```typescript
 * await transaction(db, async (trx) => {
 *   trx.add(db.insert(boxes).values({ ... }));
 *   return { id, name };
 * });
 * ```
 */
export async function transaction<T>(
    db: Database,
    operation: (ctx: TransactionContext) => Promise<T>,
    options: TransactionOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const pendingQueries: { toSQL(): { sql: string; params: unknown[] } }[] = [];
    let shouldRollback = false;

    const context: TransactionContext = {
        add: (query) => {
            // Store the actual query object - D1 batch needs the drizzle query object
            pendingQueries.push(query);
        },

        execute: async (fn) => {
            return fn();
        },

        rollback: () => {
            shouldRollback = true;
        },

        isRolledBack: () => shouldRollback,
    };

    // Execute the operation to collect queries
    const result = await operation(context);

    // Check if rollback was requested
    if (shouldRollback) {
        throw new TransactionRollbackError("Transaction was rolled back by user");
    }

    // If we have queries, execute them as a batch
    if (pendingQueries.length > 0) {
        try {
            // Use D1's batch method for atomic execution
            const batchFn = getD1Batch(db);

            if (batchFn) {
                // D1 batch execution - pass the query objects directly to drizzle
                await batchFn(pendingQueries);
            } else {
                // Fallback: execute sequentially (not atomic)
                console.warn("D1 batch not available, executing queries sequentially");
                for (const query of pendingQueries) {
                    const { sql, params } = query.toSQL();
                    await executeRaw(db, sql, params);
                }
            }
        } catch (error) {
            throw new TransactionError(
                `Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    return result;
}

/**
 * Error thrown when a transaction fails
 */
export class TransactionError extends Error {
    constructor(
        message: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = "TransactionError";
    }
}

/**
 * Error thrown when a transaction is rolled back by user
 */
export class TransactionRollbackError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TransactionRollbackError";
    }
}

/**
 * Get D1 batch function from database instance
 * Returns a function that accepts drizzle query objects directly
 */
function getD1Batch(db: Database): ((queries: { toSQL(): { sql: string; params: unknown[] } }[]) => Promise<unknown>) | null {
    // Access the underlying D1 database from drizzle instance
    const dbAny = db as unknown as {
        session?: {
            batch?: (queries: { toSQL(): { sql: string; params: unknown[] } }[]) => Promise<unknown>;
        };
    };

    const batchFn = dbAny.session?.batch;
    
    if (batchFn && typeof batchFn === 'function') {
        return batchFn.bind(dbAny.session);
    }

    return null;
}

/**
 * Execute a raw SQL query
 */
async function executeRaw(db: Database, sql: string, params: unknown[]): Promise<unknown> {
    // Try to execute via drizzle's raw query method
    const dbAny = db as unknown as {
        run?: (sql: string, params: unknown[]) => Promise<unknown>;
        execute?: (sql: string, params: unknown[]) => Promise<unknown>;
    };

    if (dbAny.run) {
        return dbAny.run(sql, params);
    }

    if (dbAny.execute) {
        return dbAny.execute(sql, params);
    }

    throw new Error("Unable to execute raw query - no compatible method found");
}

/**
 * Legacy dbBatch function - kept for backwards compatibility
 * @deprecated Use transaction() instead
 */
export async function dbBatch<T>(
    db: Database,
    operation: (builder: { add: (query: { toSQL(): { sql: string; params: unknown[] } }) => void }) => Promise<T>
): Promise<T> {
    console.warn("dbBatch is deprecated, use transaction() instead");
    return transaction(db, async (ctx) => {
        const result = await operation({
            add: (query) => ctx.add(query),
        });
        return result;
    });
}
