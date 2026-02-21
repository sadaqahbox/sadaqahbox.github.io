/**
 * ID generation service
 * Centralized unique ID creation with consistent format
 */

import { ID_PREFIXES } from "../domain/constants";

/**
 * Generates a cryptographically secure random string
 */
function generateRandomString(length: number = 7): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	
	// Use crypto.randomUUID if available (more secure)
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

// ============== Entity ID Generators ==============

export const generateBoxId = (): string => generateId(ID_PREFIXES.BOX);

export const generateSadaqahId = (index?: number): string => {
	const base = generateId(ID_PREFIXES.SADAQAH, index !== undefined ? 6 : 7);
	if (index !== undefined) {
		return base.replace(/_[a-z0-9]+$/, `_${index}_${generateRandomString(4)}`);
	}
	return base;
};

export const generateCollectionId = (): string => generateId(ID_PREFIXES.COLLECTION, 6);

export const generateCurrencyId = (): string => generateId(ID_PREFIXES.CURRENCY, 6);

export const generateCurrencyTypeId = (): string => generateId(ID_PREFIXES.CURRENCY_TYPE, 6);

export const generateRateCacheId = (): string => generateId(ID_PREFIXES.RATE_CACHE, 6);

// Export the base generateId function for custom use cases
export { generateId };

// ============== Validation ==============

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
