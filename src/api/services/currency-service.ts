/**
 * Currency Service
 * 
 * Business logic layer for currency operations.
 * Uses Repository pattern for data access.
 * 
 * @module api/services/currency-service
 */

import type { Context } from "hono";
import { BaseService, createServiceFactory } from "./base-service";
import { CurrencyRepository } from "../repositories";
import type { Currency } from "../schemas";
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_NAME, DEFAULT_CURRENCY_SYMBOL } from "../domain/constants";

// ============== Types ==============

export interface CreateCurrencyInput {
  code: string;
  name: string;
  symbol?: string;
  currencyTypeId?: string;
}

export interface UpdateCurrencyInput {
  code?: string;
  name?: string;
  symbol?: string;
  currencyTypeId?: string;
}

// ============== Service ==============

export class CurrencyService extends BaseService {
  private get currencyRepo() {
    return new CurrencyRepository(this.db);
  }

  // ============== CRUD Operations ==============

  /**
   * Create a new currency
   */
  async createCurrency(input: CreateCurrencyInput): Promise<Currency> {
    const code = input.code.toUpperCase();
    
    // Check for duplicate
    const existing = await this.currencyRepo.findByCode(code);
    if (existing) {
      throw new Error(`Currency with code "${code}" already exists`);
    }

    return this.currencyRepo.create({
      code,
      name: input.name,
      symbol: input.symbol,
      currencyTypeId: input.currencyTypeId,
    });
  }

  /**
   * Get a currency by ID
   */
  async getCurrency(currencyId: string): Promise<Currency | null> {
    const currency = await this.currencyRepo.findById(currencyId);
    if (!currency) return null;
    
    return {
      id: currency.id,
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol || undefined,
      currencyTypeId: currency.currencyTypeId || undefined,
    };
  }

  /**
   * Get a currency by ID with relations
   */
  async getCurrencyWithRelations(currencyId: string) {
    return this.currencyRepo.findByIdWithRelations(currencyId);
  }

  /**
   * Get a currency by code
   */
  async getCurrencyByCode(code: string): Promise<Currency | null> {
    const currency = await this.currencyRepo.findByCode(code.toUpperCase());
    if (!currency) return null;
    
    return {
      id: currency.id,
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol || undefined,
      currencyTypeId: currency.currencyTypeId || undefined,
    };
  }

  /**
   * List all currencies
   */
  async listCurrencies(): Promise<Currency[]> {
    const currencies = await this.currencyRepo.findAll();
    return currencies.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol || undefined,
      currencyTypeId: c.currencyTypeId || undefined,
    }));
  }

  /**
   * List all currencies with relations
   */
  async listCurrenciesWithRelations() {
    return this.currencyRepo.findAllWithRelations();
  }

	/**
	 * Update a currency
	 */
  async updateCurrency(currencyId: string, input: UpdateCurrencyInput): Promise<Currency | null> {
    const updateData: { code?: string; name?: string; symbol?: string; currencyTypeId?: string } = {};

    if (input.code !== undefined) {
      updateData.code = input.code.toUpperCase();
    }
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.symbol !== undefined) {
      updateData.symbol = input.symbol;
    }
    if (input.currencyTypeId !== undefined) {
      updateData.currencyTypeId = input.currencyTypeId;
    }

    const updated = await this.currencyRepo.update(currencyId, updateData);
    if (!updated) return null;

    return this.getCurrency(currencyId);
  }

  /**
   * Delete a currency
   */
  async deleteCurrency(currencyId: string): Promise<boolean> {
    return this.currencyRepo.delete(currencyId);
  }

  // ============== Special Operations ==============

  /**
   * Get or create a currency by code
   */
  async getOrCreate(input: CreateCurrencyInput): Promise<Currency> {
    return this.currencyRepo.getOrCreate({
      code: input.code.toUpperCase(),
      name: input.name,
      symbol: input.symbol,
      currencyTypeId: input.currencyTypeId,
    });
  }

  /**
   * Get the default currency
   */
  async getDefaultCurrency(): Promise<Currency> {
    return this.getOrCreate({
      code: DEFAULT_CURRENCY_CODE,
      name: DEFAULT_CURRENCY_NAME,
      symbol: DEFAULT_CURRENCY_SYMBOL,
    });
  }

  /**
   * Get multiple currencies by IDs (batch operation)
   */
  async getManyCurrencies(ids: string[]): Promise<Map<string, Currency>> {
    return this.currencyRepo.findMany(ids);
  }
}

export const getCurrencyService = createServiceFactory(CurrencyService);
