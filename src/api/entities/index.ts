/**
 * Entities - Database access layer
 * 
 * Each entity class handles database operations for a specific domain.
 * No HTTP or framework-specific code here - just database operations.
 */

import type { Context } from "hono";
import { getDbFromContext, type Database } from "../../db";

// Export base entity
export { BaseEntity } from "./base-entity";

// Export entity classes
export { BoxEntity } from "./box";
export { SadaqahEntity } from "./sadaqah";
export { CurrencyEntity } from "./currency";
export { CurrencyTypeEntity } from "./currency-type";

// Export mappers
export { mapBox, mapBoxes, mapSadaqah, mapSadaqahs } from "./mappers";

// ============== Entity Factory Functions ==============

import { BoxEntity } from "./box";
import { SadaqahEntity } from "./sadaqah";
import { CurrencyEntity } from "./currency";
import { CurrencyTypeEntity } from "./currency-type";

/** Creates a BoxEntity from Hono context */
export function getBoxEntity(c: Context<{ Bindings: Env }>): BoxEntity {
	return new BoxEntity(getDbFromContext(c));
}

/** Creates a SadaqahEntity from Hono context */
export function getSadaqahEntity(c: Context<{ Bindings: Env }>): SadaqahEntity {
	return new SadaqahEntity(getDbFromContext(c));
}

/** Creates a CurrencyEntity from Hono context */
export function getCurrencyEntity(c: Context<{ Bindings: Env }>): CurrencyEntity {
	return new CurrencyEntity(getDbFromContext(c));
}

/** Creates a CurrencyTypeEntity from Hono context */
export function getCurrencyTypeEntity(c: Context<{ Bindings: Env }>): CurrencyTypeEntity {
	return new CurrencyTypeEntity(getDbFromContext(c));
}

// ============== Direct Database Factory ==============

/** Creates entities directly from a database instance */
export function createEntities(db: Database) {
	return {
		box: new BoxEntity(db),
		sadaqah: new SadaqahEntity(db),
		currency: new CurrencyEntity(db),
		currencyType: new CurrencyTypeEntity(db),
	};
}
