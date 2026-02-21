/**
 * Domain constants
 * Centralized configuration values
 */

// ============== API Configuration ==============
export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;

// ============== Pagination Defaults ==============
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// ============== Currency Defaults ==============
export const DEFAULT_CURRENCY_CODE = "USD";
export const DEFAULT_CURRENCY_NAME = "US Dollar";
export const DEFAULT_CURRENCY_SYMBOL = "$";

// ============== Sadaqah Defaults ==============
export const DEFAULT_SADAQAH_VALUE = 1;
export const DEFAULT_SADAQAH_AMOUNT = 1;
export const MAX_SADAQAH_AMOUNT = 1000;

// ============== Box Defaults ==============
export const MAX_BOX_NAME_LENGTH = 100;
export const MAX_BOX_DESCRIPTION_LENGTH = 500;

// ============== Tag Defaults ==============
export const MAX_TAG_NAME_LENGTH = 50;
export const DEFAULT_TAG_COLOR = "#6366F1";

// ============== ID Prefixes ==============
export const ID_PREFIXES = {
	BOX: "box",
	SADAQAH: "sadaqah",
	COLLECTION: "col",
	CURRENCY: "cur",
	CURRENCY_TYPE: "ctyp",
	TAG: "tag",
} as const;

// ============== Cache TTLs (in milliseconds) ==============
export const CACHE_TTL = {
	CURRENCY: 5 * 60 * 1000, // 5 minutes
	TAG: 5 * 60 * 1000, // 5 minutes
	BOX_LIST: 30 * 1000, // 30 seconds
} as const;

// ============== Default Currency Types ==============
export const DEFAULT_CURRENCY_TYPES = {
	FIAT: { name: "Fiat", description: "Government-issued physical currency" },
	CRYPTO: { name: "Crypto", description: "Digital or cryptocurrency" },
	COMMODITY: { name: "Commodity", description: "Commodity-backed currency (gold, silver, etc.)" },
} as const;

// ============== Validation Patterns ==============
export const VALIDATION_PATTERNS = {
	// Hex color code (#FFF or #FFFFFF)
	COLOR_HEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
	// ISO 4217 currency code (3 uppercase letters)
	CURRENCY_CODE: /^[A-Z]{3}$/,
	// ID format (prefix_timestamp_random)
	ID_FORMAT: /^(box|sadaqah|col|cur|ctyp|tag)_[0-9]+_[a-z0-9]+$/,
} as const;
