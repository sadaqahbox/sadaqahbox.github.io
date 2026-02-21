/**
 * Base Service
 * 
 * Abstract base class for domain services.
 * Services orchestrate entities and encapsulate business logic.
 */

import type { Context } from "hono";
import type { Database } from "../../db";
import { getDbFromContext } from "../../db";

/**
 * Base class for all domain services
 */
export abstract class BaseService {
	protected db: Database;

	constructor(dbOrContext: Database | Context<{ Bindings: Env }>) {
		if ("req" in dbOrContext) {
			// It's a Hono context
			this.db = getDbFromContext(dbOrContext);
		} else {
			// It's a database instance
			this.db = dbOrContext;
		}
	}
}

/**
 * Factory type for creating services
 */
export type ServiceFactory<T extends BaseService> = (
	c: Context<{ Bindings: Env }>
) => T;

/**
 * Creates a service factory function
 */
export function createServiceFactory<T extends BaseService>(
	ServiceClass: new (db: Database) => T
): ServiceFactory<T> {
	return (c: Context<{ Bindings: Env }>) => new ServiceClass(getDbFromContext(c));
}
