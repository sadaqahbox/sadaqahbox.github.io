/**
 * API Constants
 * 
 * Centralized configuration values for the API layer.
 * All API-wide defaults, limits, and constants should be defined here.
 */

// ============== Pagination ==============

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// ============== Rate Limiting ==============

export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;

export const STRICT_RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
export const STRICT_RATE_LIMIT_MAX_REQUESTS = 10;

// ============== Validation ==============

export const MAX_BOX_NAME_LENGTH = 100;
export const MAX_CURRENCY_CODE_LENGTH = 3;
export const MAX_CURRENCY_NAME_LENGTH = 100;

// ============== Caching ==============

export const DEFAULT_CACHE_TTL_SECONDS = 300; // 5 minutes

// ============== Security ==============

export const CSRF_TOKEN_LENGTH = 32;
export const CSRF_COOKIE_NAME = "csrf-token";

// ============== Currency ==============

/**
 * Default base currency code for new boxes
 * Used when no baseCurrencyId is specified during box creation
 */
export const DEFAULT_BASE_CURRENCY_CODE = "XAU";

/**
 * Default base currency name
 */
export const DEFAULT_BASE_CURRENCY_NAME = "Gold";

// ============== Box Limits ==============

/**
 * Maximum number of boxes a user can create
 */
export const MAX_BOXES_PER_USER = 20;

/**
 * Default base currency symbol
 */
export const DEFAULT_BASE_CURRENCY_SYMBOL = "";
