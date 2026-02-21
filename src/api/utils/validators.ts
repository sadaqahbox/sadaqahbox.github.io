import { z } from "zod";
import { VALIDATION_PATTERNS, MAX_BOX_NAME_LENGTH, MAX_BOX_DESCRIPTION_LENGTH, MAX_TAG_NAME_LENGTH } from "./constants";

/**
 * Common validation functions and schemas
 */

// ============== String Validators ==============

/**
 * Sanitizes a string by trimming whitespace
 */
export function sanitizeString(value: string | undefined | null): string | undefined {
	if (value === undefined || value === null) return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Validates that a string is not empty after trimming
 */
export function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

// ============== ID Validators ==============

/**
 * Validates an ID format
 */
export function isValidId(id: string, prefix?: string): boolean {
	if (!id || typeof id !== "string") return false;
	if (prefix) {
		return id.startsWith(`${prefix}_`);
	}
	return VALIDATION_PATTERNS.ID_FORMAT.test(id);
}

// ============== Schema Validators ==============

/**
 * Zod schema for sanitized string
 */
export const SanitizedString = z.string().transform((val) => sanitizeString(val) ?? "");

/**
 * Zod schema for box name
 */
export const BoxNameSchema = z
	.string()
	.min(1, "Box name is required")
	.max(MAX_BOX_NAME_LENGTH, `Box name must be less than ${MAX_BOX_NAME_LENGTH} characters`)
	.transform((val) => val.trim());

/**
 * Zod schema for box description
 */
export const BoxDescriptionSchema = z
	.string()
	.max(MAX_BOX_DESCRIPTION_LENGTH, `Description must be less than ${MAX_BOX_DESCRIPTION_LENGTH} characters`)
	.transform((val) => sanitizeString(val))
	.optional();

/**
 * Zod schema for tag name
 */
export const TagNameSchema = z
	.string()
	.min(1, "Tag name is required")
	.max(MAX_TAG_NAME_LENGTH, `Tag name must be less than ${MAX_TAG_NAME_LENGTH} characters`)
	.transform((val) => val.trim());

/**
 * Zod schema for hex color
 */
export const ColorHexSchema = z
	.string()
	.regex(VALIDATION_PATTERNS.COLOR_HEX, "Invalid hex color format (use #FFF or #FFFFFF)")
	.optional();

/**
 * Zod schema for currency code
 */
export const CurrencyCodeSchema = z
	.string()
	.length(3, "Currency code must be 3 characters")
	.transform((val) => val.toUpperCase());

/**
 * Zod schema for pagination params
 */
export const PaginationSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============== Date Validators ==============

/**
 * Validates a date range
 */
export function isValidDateRange(from: string | undefined, to: string | undefined): boolean {
	if (!from || !to) return true;
	const fromDate = new Date(from);
	const toDate = new Date(to);
	return fromDate <= toDate;
}

/**
 * Validates ISO date string
 */
export function isValidISODate(date: string): boolean {
	const parsed = new Date(date);
	return !isNaN(parsed.getTime()) && date === parsed.toISOString().split("T")[0];
}

// ============== Number Validators ==============

/**
 * Validates a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
	return typeof value === "number" && !isNaN(value) && isFinite(value) && value > 0;
}

/**
 * Validates a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
	return typeof value === "number" && !isNaN(value) && isFinite(value) && value >= 0;
}
