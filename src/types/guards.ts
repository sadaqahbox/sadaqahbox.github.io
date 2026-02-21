/**
 * Type Guards
 *
 * Type-safe runtime checks for API responses and domain types.
 */

import type { Box, Sadaqah, Tag, Currency, Collection, ApiResponse } from "./index";

/**
 * Check if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check if value has required string property
 */
function hasString(obj: Record<string, unknown>, key: string): boolean {
    return key in obj && typeof obj[key] === "string";
}

/**
 * Check if value has optional string property
 */
function hasOptionalString(obj: Record<string, unknown>, key: string): boolean {
    return !(key in obj) || typeof obj[key] === "string";
}

/**
 * Check if value has required number property
 */
function hasNumber(obj: Record<string, unknown>, key: string): boolean {
    return key in obj && typeof obj[key] === "number";
}

/**
 * Type guard for Currency
 */
export function isCurrency(value: unknown): value is Currency {
    if (!isObject(value)) return false;
    return (
        hasString(value, "id") &&
        hasString(value, "code") &&
        hasString(value, "name") &&
        hasOptionalString(value, "symbol") &&
        hasOptionalString(value, "currencyTypeId")
    );
}

/**
 * Type guard for Tag
 */
export function isTag(value: unknown): value is Tag {
    if (!isObject(value)) return false;
    return (
        hasString(value, "id") &&
        hasString(value, "name") &&
        hasOptionalString(value, "color") &&
        hasString(value, "createdAt")
    );
}

/**
 * Type guard for Box
 */
export function isBox(value: unknown): value is Box {
    if (!isObject(value)) return false;
    return (
        hasString(value, "id") &&
        hasString(value, "name") &&
        hasOptionalString(value, "description") &&
        hasNumber(value, "count") &&
        hasNumber(value, "totalValue") &&
        hasOptionalString(value, "currencyId") &&
        hasString(value, "createdAt") &&
        hasString(value, "updatedAt")
    );
}

/**
 * Type guard for Sadaqah
 */
export function isSadaqah(value: unknown): value is Sadaqah {
    if (!isObject(value)) return false;
    return (
        hasString(value, "id") &&
        hasString(value, "boxId") &&
        hasNumber(value, "value") &&
        hasString(value, "currencyId") &&
        hasString(value, "createdAt")
    );
}

/**
 * Type guard for Collection
 */
export function isCollection(value: unknown): value is Collection {
    if (!isObject(value)) return false;
    return (
        hasString(value, "id") &&
        hasString(value, "boxId") &&
        hasString(value, "emptiedAt") &&
        hasNumber(value, "totalValue") &&
        hasString(value, "currencyId")
    );
}

/**
 * Type guard for ApiResponse
 */
export function isApiResponse<T>(value: unknown, dataGuard?: (data: unknown) => data is T): value is ApiResponse<T> {
    if (!isObject(value)) return false;
    if (!("success" in value) || typeof value.success !== "boolean") return false;
    if (value.success && "data" in value && dataGuard) {
        return dataGuard(value.data);
    }
    return true;
}

/**
 * Safely parse unknown as array with type guard
 */
export function parseArray<T>(value: unknown, itemGuard: (item: unknown) => item is T): T[] {
    if (!Array.isArray(value)) return [];
    return value.filter(itemGuard);
}

/**
 * Safely extract string from unknown
 */
export function parseString(value: unknown, defaultValue = ""): string {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    return defaultValue;
}

/**
 * Safely extract number from unknown
 */
export function parseNumber(value: unknown, defaultValue = 0): number {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
}

/**
 * Safely extract Date from unknown
 */
export function parseDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }
    return null;
}
