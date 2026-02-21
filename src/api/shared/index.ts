/**
 * Shared utilities and services
 */

// ID generator - explicitly export to avoid naming conflicts
export {
	generateBoxId,
	generateSadaqahId,
	generateCollectionId,
	generateCurrencyId,
	generateCurrencyTypeId,
	generateTagId,
	isValidId,
	getIdPrefix,
} from "./id-generator";

// Cache
export { Cache, currencyCache, currencyTypeCache, tagCache } from "./cache";

// Validators (note: isValidId is not re-exported from here to avoid conflicts)
export {
	sanitizeString,
	isNonEmptyString,
	isValidDateRange,
	isValidISODate,
	isPositiveNumber,
	isNonNegativeNumber,
	SanitizedString,
	BoxNameSchema,
	BoxDescriptionSchema,
	TagNameSchema,
	ColorHexSchema,
	CurrencyCodeSchema,
	PaginationParamsSchema,
} from "./validators";

// Response helpers
export {
	success,
	paginated,
	error,
	jsonError,
	notFound,
	validationError,
	conflict,
	createPagination,
	normalizePagination,
	getOffset,
} from "./response";

// Route builder utilities
export {
	// Schemas
	SuccessResponseSchema,
	ErrorResponseSchema,
	NotFoundResponseSchema,
	PaginationQuerySchema,
	PaginationSchema,
	// Helpers
	create200Response,
	create201Response,
	create404Response,
	create400Response,
	create409Response,
	createPaginatedResponse,
	createIdParamSchema,
	buildRoute,
	// Type-safe extractors
	getParams,
	getQuery,
	getBody,
	jsonSuccess,
	// Registration
	registerRoute,
	registerRoutes,
} from "./route-builder";
