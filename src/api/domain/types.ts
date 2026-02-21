/**
 * Domain types
 * 
 * Re-exported from unified Zod schemas for single source of truth.
 * Additional domain-specific types that don't need Zod schemas are defined here.
 * 
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
} from "../schemas";

// Re-export input types
export type {
  CreateCurrencyTypeInput,
  CreateCurrencyInput,
  CreateBoxInput,
  UpdateBoxInput,
  AddSadaqahInput,
} from "../schemas";

// ============== Domain-Specific Types ==============
// These types are used internally and don't need Zod schemas

export interface CollectionsListResult {
  collections: import("../schemas").Collection[];
  total: number;
}

export interface ListSadaqahsResult {
  sadaqahs: import("../schemas").Sadaqah[];
  total: number;
  summary: {
    totalSadaqahs: number;
    totalValue: number;
    currency: import("../schemas").Currency;
  };
}

export interface AddMultipleResult {
  sadaqahs: import("../schemas").Sadaqah[];
  box: import("../schemas").Box;
}

// ============== Options Interfaces ==============

export interface AddSadaqahOptions {
  boxId: string;
  value: number;
  currencyId: string;
  amount?: number;
  metadata?: Record<string, string>;
}

export interface CreateCurrencyOptions {
  code: string;
  name: string;
  symbol?: string;
  currencyTypeId?: string;
  goldValue?: number; // Grams of gold per 1 unit of this currency
}

export interface GetOrCreateOptions {
  code: string;
  name?: string;
  symbol?: string;
  currencyTypeId?: string;
  goldValue?: number; // Grams of gold per 1 unit of this currency
}

export interface CreateCurrencyTypeOptions {
  name: string;
  description?: string;
}

// ============== Pagination ==============

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

// ============== List Results ==============

export interface ListResult<T> {
  items: T[];
  pagination: import("../schemas").PaginationInfo;
}

// ============== Date Range ==============

export interface DateRange {
  from?: string;
  to?: string;
}
