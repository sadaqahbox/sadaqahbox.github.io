/**
 * Currency Type Service
 * 
 * Business logic layer for currency type operations.
 * Uses Repository pattern for data access.
 * 
 * @module api/services/currency-type-service
 */

import type { Context } from "hono";
import { BaseService, createServiceFactory } from "./base-service";
import { CurrencyTypeRepository } from "../repositories";
import type { CurrencyType } from "../schemas";
import { DEFAULT_CURRENCY_TYPES } from "../domain/constants";

// ============== Types ==============

export interface CreateCurrencyTypeInput {
  name: string;
  description?: string;
}

export interface UpdateCurrencyTypeInput {
  name?: string;
  description?: string;
}

// ============== Service ==============

export class CurrencyTypeService extends BaseService {
  private get currencyTypeRepo() {
    return new CurrencyTypeRepository(this.db);
  }

  // ============== CRUD Operations ==============

  /**
   * Create a new currency type
   */
  async createCurrencyType(input: CreateCurrencyTypeInput): Promise<CurrencyType> {
    // Check for duplicate
    const existing = await this.currencyTypeRepo.findByName(input.name);
    if (existing) {
      throw new Error(`Currency type "${input.name}" already exists`);
    }

    return this.currencyTypeRepo.create({
      name: input.name,
      description: input.description,
    });
  }

  /**
   * Get a currency type by ID
   */
  async getCurrencyType(currencyTypeId: string): Promise<CurrencyType | null> {
    const currencyType = await this.currencyTypeRepo.findById(currencyTypeId);
    if (!currencyType) return null;

    return {
      id: currencyType.id,
      name: currencyType.name,
      description: currencyType.description || undefined,
    };
  }

  /**
   * Get a currency type by ID with relations
   */
  async getCurrencyTypeWithRelations(currencyTypeId: string) {
    return this.currencyTypeRepo.findByIdWithRelations(currencyTypeId);
  }

  /**
   * Get a currency type by name
   */
  async getCurrencyTypeByName(name: string): Promise<CurrencyType | null> {
    const currencyType = await this.currencyTypeRepo.findByName(name);
    if (!currencyType) return null;

    return {
      id: currencyType.id,
      name: currencyType.name,
      description: currencyType.description || undefined,
    };
  }

  /**
   * List all currency types
   */
  async listCurrencyTypes(): Promise<CurrencyType[]> {
    const currencyTypes = await this.currencyTypeRepo.findAll();
    return currencyTypes.map((ct) => ({
      id: ct.id,
      name: ct.name,
      description: ct.description || undefined,
    }));
  }

  /**
   * List all currency types with relations
   */
  async listCurrencyTypesWithRelations() {
    return this.currencyTypeRepo.findAllWithRelations();
  }

	/**
   * Update a currency type
   */
  async updateCurrencyType(
    currencyTypeId: string,
    input: UpdateCurrencyTypeInput
  ): Promise<CurrencyType | null> {
    const updateData: { name?: string; description?: string } = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    const updated = await this.currencyTypeRepo.update(currencyTypeId, updateData);
    if (!updated) return null;

    return this.getCurrencyType(currencyTypeId);
  }

  /**
   * Delete a currency type
   */
  async deleteCurrencyType(currencyTypeId: string): Promise<boolean> {
    return this.currencyTypeRepo.delete(currencyTypeId);
  }

  // ============== Special Operations ==============

  /**
   * Get or create a currency type by name
   */
  async getOrCreate(name: string, description?: string): Promise<CurrencyType> {
    return this.currencyTypeRepo.getOrCreate(name, description);
  }

  /**
   * Initialize default currency types (Fiat, Crypto, Commodity)
   */
  async initializeDefaults(): Promise<CurrencyType[]> {
    return this.currencyTypeRepo.initializeDefaults();
  }

  /**
   * Get Fiat currency type
   */
  async getFiatType(): Promise<CurrencyType> {
    return this.currencyTypeRepo.getFiatType();
  }

  /**
   * Get Crypto currency type
   */
  async getCryptoType(): Promise<CurrencyType> {
    return this.currencyTypeRepo.getCryptoType();
  }

  /**
   * Get Commodity currency type
   */
  async getCommodityType(): Promise<CurrencyType> {
    return this.currencyTypeRepo.getCommodityType();
  }

  /**
   * Get multiple currency types by IDs (batch operation)
   */
  async getManyCurrencyTypes(ids: string[]): Promise<Map<string, CurrencyType>> {
    return this.currencyTypeRepo.findMany(ids);
  }
}

export const getCurrencyTypeService = createServiceFactory(CurrencyTypeService);
