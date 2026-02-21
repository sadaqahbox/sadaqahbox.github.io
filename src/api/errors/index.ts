/**
 * Domain-Specific Errors
 * 
 * Structured error types for consistent error handling across the application.
 * Extends the base AppError with domain-specific context.
 * 
 * @module api/errors
 */

import { AppError } from "../middleware/error-handler";

// ============== Entity Errors ==============

/**
 * Error thrown when an entity is not found
 */
export class EntityNotFoundError extends AppError {
  constructor(
    public readonly entity: string,
    public readonly id: string
  ) {
    super(`${entity} with id "${id}" not found`, "NOT_FOUND", 404);
    this.name = "EntityNotFoundError";
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when a user lacks authorization
 */
export class AuthorizationError extends AppError {
  constructor(message = "Not authorized to perform this action") {
    super(message, "FORBIDDEN", 403);
    this.name = "AuthorizationError";
  }
}

/**
 * Error thrown when authentication is required
 */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "AuthenticationError";
  }
}

/**
 * Error thrown when a resource conflict occurs (e.g., duplicate)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

/**
 * Error thrown when a business rule is violated
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "BUSINESS_RULE_VIOLATION", 422, details);
    this.name = "BusinessRuleError";
  }
}

// ============== Domain-Specific Errors ==============

/**
 * Error thrown when a box operation fails
 */
export class BoxError extends AppError {
  constructor(message: string, code: string = "BOX_ERROR", status: number = 400) {
    super(message, code, status);
    this.name = "BoxError";
  }
}

/**
 * Error thrown when a box is not found
 */
export class BoxNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super("Box", id);
    this.name = "BoxNotFoundError";
  }
}

/**
 * Error thrown when box validation fails
 */
export class BoxValidationError extends ValidationError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "BoxValidationError";
  }
}

/**
 * Error thrown when user reaches the maximum number of boxes
 */
export class BoxLimitError extends BoxError {
  constructor(limit: number) {
    super(
      `You have reached the maximum limit of ${limit} boxes. Please delete an existing box before creating a new one.`,
      "BOX_LIMIT_REACHED",
      422
    );
    this.name = "BoxLimitError";
  }
}

/**
 * Error thrown when a sadaqah operation fails
 */
export class SadaqahError extends AppError {
  constructor(message: string, code: string = "SADAQAH_ERROR", status: number = 400) {
    super(message, code, status);
    this.name = "SadaqahError";
  }
}

/**
 * Error thrown when a sadaqah is not found
 */
export class SadaqahNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super("Sadaqah", id);
    this.name = "SadaqahNotFoundError";
  }
}

/**
 * Error thrown when a currency operation fails
 */
export class CurrencyError extends AppError {
  constructor(message: string, code: string = "CURRENCY_ERROR", status: number = 400) {
    super(message, code, status);
    this.name = "CurrencyError";
  }
}

/**
 * Error thrown when a currency is not found
 */
export class CurrencyNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super("Currency", id);
    this.name = "CurrencyNotFoundError";
  }
}

// ============== Result Pattern ==============

/**
 * Result type for operations that can fail
 * Use this instead of throwing exceptions for expected failures
 */
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Result namespace with factory functions
 */
export const Result = {
  /**
   * Create a successful result
   */
  ok: <T>(value: T): Result<T> => ({ ok: true, value }),

  /**
   * Create a failed result
   */
  err: <T, E extends AppError>(error: E): Result<T, E> => ({ ok: false, error }),

  /**
   * Check if a result is successful
   */
  isOk: <T, E>(result: Result<T, E>): result is { ok: true; value: T } => result.ok === true,

  /**
   * Check if a result is an error
   */
  isErr: <T, E>(result: Result<T, E>): result is { ok: false; error: E } => result.ok === false,

  /**
   * Map a successful result to a new value
   */
  map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    if (result.ok) {
      return { ok: true, value: fn(result.value) };
    }
    return result as Result<U, E>;
  },

  /**
   * Map an error result to a new error
   */
  mapErr: <T, E, F extends AppError>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
    if (!result.ok) {
      return { ok: false, error: fn(result.error) };
    }
    return result as Result<T, F>;
  },

  /**
   * Unwrap a result, throwing if it's an error
   */
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (result.ok) {
      return result.value;
    }
    throw result.error;
  },

  /**
   * Unwrap a result, returning a default if it's an error
   */
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T => {
    if (result.ok) {
      return result.value;
    }
    return defaultValue;
  },

  /**
   * Chain multiple operations that return Results
   */
  andThen: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
    if (result.ok) {
      return fn(result.value);
    }
    return result;
  },
};

// ============== Async Result Helpers ==============

/**
 * Async result type for async operations that can fail
 */
export type AsyncResult<T, E = AppError> = Promise<Result<T, E>>;

/**
 * Try to execute an async operation and return a Result
 */
export async function tryAsync<T>(
  operation: () => Promise<T>
): Promise<Result<T, AppError>> {
  try {
    const value = await operation();
    return Result.ok(value);
  } catch (error) {
    if (error instanceof AppError) {
      return Result.err(error);
    }
    return Result.err(new AppError(
      error instanceof Error ? error.message : "Unknown error",
      "INTERNAL_ERROR",
      500
    ));
  }
}
