import { ID_PREFIXES } from "../utils/constants";

/**
 * Centralized ID generation service
 * Generates unique IDs with consistent format: {prefix}_{timestamp}_{random}
 */

/**
 * Generates a cryptographically secure random string
 */
function generateRandomString(length: number = 7): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	// Use crypto.randomUUID if available (more secure), fallback to Math.random
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		const uuid = crypto.randomUUID().replace(/-/g, "");
		for (let i = 0; i < length; i++) {
			result += chars[parseInt(uuid.slice(i * 2, i * 2 + 2), 16) % chars.length];
		}
	} else {
		for (let i = 0; i < length; i++) {
			result += chars[Math.floor(Math.random() * chars.length)];
		}
	}
	return result;
}

/**
 * Generates a unique ID with the given prefix
 */
function generateId(prefix: string, randomLength: number = 7): string {
	return `${prefix}_${Date.now()}_${generateRandomString(randomLength)}`;
}

/**
 * Generates a box ID
 */
export function generateBoxId(): string {
	return generateId(ID_PREFIXES.BOX);
}

/**
 * Generates a sadaqah ID with optional index for batch operations
 */
export function generateSadaqahId(index?: number): string {
	const base = generateId(ID_PREFIXES.SADAQAH, index !== undefined ? 6 : 7);
	if (index !== undefined) {
		return base.replace(/_[a-z0-9]+$/, `_${index}_${generateRandomString(4)}`);
	}
	return base;
}

/**
 * Generates a collection ID
 */
export function generateCollectionId(): string {
	return generateId(ID_PREFIXES.COLLECTION, 6);
}

/**
 * Generates a currency ID
 */
export function generateCurrencyId(): string {
	return generateId(ID_PREFIXES.CURRENCY, 6);
}

/**
 * Generates a currency type ID
 */
export function generateCurrencyTypeId(): string {
	return generateId(ID_PREFIXES.CURRENCY_TYPE, 6);
}

/**
 * Generates a tag ID
 */
export function generateTagId(): string {
	return generateId(ID_PREFIXES.TAG, 6);
}

/**
 * Validates an ID format
 */
export function isValidId(id: string, expectedPrefix?: string): boolean {
	if (!id || typeof id !== "string") return false;
	
	const parts = id.split("_");
	if (parts.length < 2) return false;
	
	const [prefix, timestamp] = parts;
	
	// Validate prefix
	if (expectedPrefix && prefix !== expectedPrefix) return false;
	if (!Object.values(ID_PREFIXES).includes(prefix as typeof ID_PREFIXES[keyof typeof ID_PREFIXES])) {
		return false;
	}
	
	// Validate timestamp is a valid number
	if (isNaN(Number(timestamp))) return false;
	
	return true;
}

/**
 * Extracts prefix from an ID
 */
export function getIdPrefix(id: string): string | null {
	if (!id || typeof id !== "string") return null;
	const parts = id.split("_");
	return parts[0] || null;
}
