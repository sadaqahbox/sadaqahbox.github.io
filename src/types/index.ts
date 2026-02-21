/**
 * Frontend Types
 * 
 * Re-exported from unified Zod schemas for single source of truth.
 * @see src/api/schemas/index.ts
 */

// Re-export all types from unified schemas
export type {
  CurrencyType,
  Currency,
  Box,
  Sadaqah,
  Collection,
  BoxStats,
  BoxSummary,
  CollectionResult,
  DeleteBoxResult,
  CreateSadaqahResult,
  PaginationQuery,
  PaginationInfo,
} from "../api/schemas";

// Re-export input types for forms
export type {
  CreateCurrencyTypeInput,
  CreateCurrencyInput,
  CreateBoxInput,
  UpdateBoxInput,
  AddSadaqahInput,
} from "../api/schemas";

// API response type for generic use
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Re-export all type guards
export * from "./guards";
