/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Database } from "../../db";

/**
 * D1 batch operation helper.
 * 
 * D1 supports batching multiple SQL statements in a single call.
 * This provides:
 * - Better performance (reduces network round trips)
 * - Atomicity (all statements succeed or all fail)
 * - Works in both local dev and production
 * 
 * Each statement in the batch is executed sequentially in auto-commit mode.
 * If any statement fails, the entire batch aborts.
 * 
 * Usage:
 *   const result = await dbBatch(db, async (b) => {
 *     b.add(db.insert(boxes).values({...}));
 *     b.add(db.insert(boxTags).values([...]));
 *     return { id, name };
 *   });
 */

interface BatchBuilder {
	add: (query: any) => void;
}

export async function dbBatch<T>(
	db: Database,
	operation: (builder: BatchBuilder) => Promise<T>
): Promise<T> {
	const queries: any[] = [];
	
	const builder: BatchBuilder = {
		add: (query: any) => {
			queries.push(query);
		}
	};
	
	// Execute the operation to collect queries
	const result = await operation(builder);
	
	// If we have queries, execute them as a batch
	if (queries.length > 0) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (db as any).batch(queries);
	}
	
	return result;
}
