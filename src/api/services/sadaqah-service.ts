/**
 * Sadaqah Service
 *
 * Business logic for sadaqah operations.
 * Uses Repository pattern for data access.
 */

import { eq, sql } from "drizzle-orm";
import { BaseService, createServiceFactory } from "./base-service";
import { SadaqahRepository, BoxRepository, CurrencyRepository } from "../repositories";
import type { TotalValueExtra } from "../repositories/box.repository";
import { GoldRateService } from "./gold-rate-service";
import { sadaqahs, boxes, currencies } from "../../db/schema";
import type { Sadaqah, Box, Currency } from "../schemas";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../config/constants";
import { DEFAULT_SADAQAH_VALUE, DEFAULT_SADAQAH_AMOUNT, MAX_SADAQAH_AMOUNT } from "../domain/constants";
import { generateSadaqahId } from "../shared/id-generator";
import { dbBatch } from "../shared/transaction";
import { SadaqahNotFoundError, BoxNotFoundError, ValidationError } from "../errors";
import { logger } from "../shared/logger";

export interface AddSadaqahInput {
  amount?: number;
  value?: number;
  currencyId?: string;
  metadata?: Record<string, string>;
}

export interface ListSadaqahsOptions {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export interface AddSadaqahResult {
  sadaqah: Sadaqah;
  updatedBox: Box;
}

export interface DeleteSadaqahResult {
  deleted: boolean;
  updatedBox?: Box;
}

/**
 * Convert a value from one currency to another using USD as the base
 * @param value - The value to convert
 * @param fromCurrency - The source currency (must have usdValue - how many USD one unit is worth)
 * @param toCurrency - The target currency (must have usdValue - how many USD one unit is worth)
 * @returns The converted value, or null if conversion is not possible
 */
function convertCurrency(
  value: number,
  fromCurrency: { code: string; usdValue?: number | null },
  toCurrency: { code: string; usdValue?: number | null }
): number | null {
  // If either currency doesn't have a USD value, return null (conversion not possible)
  if (!fromCurrency.usdValue || !toCurrency.usdValue) {
    return null;
  }
  
  // usdValue represents how many USD one unit of the currency is worth
  // Step 1: Convert from source currency to USD
  // If 1 Gold = 2000 USD, then valueInUsd = goldAmount * 2000
  const valueInUsd = value * fromCurrency.usdValue;
  
  // Step 2: Convert from USD to target currency
  // If 1 Gold = 2000 USD, then goldAmount = usdAmount / 2000
  const convertedValue = valueInUsd / toCurrency.usdValue;
  
  return convertedValue;
}

export class SadaqahService extends BaseService {
  private get sadaqahRepo() {
    return new SadaqahRepository(this.db);
  }

  private get boxRepo() {
    return new BoxRepository(this.db);
  }

  private get currencyRepo() {
    return new CurrencyRepository(this.db);
  }

  private get rateService() {
    return GoldRateService.getInstance(this.db);
  }

  /**
   * Get currency with usdValue
   * Only fetches rates if API rate limits allow (1 hour cooldown)
   * @returns Currency with usdValue, or currency without usdValue if rate is not available or APIs are rate-limited
   */
  private async getCurrencyWithRate(currencyId: string): Promise<{ id: string; code: string; name: string; usdValue?: number | null }> {
    // First check if currency exists
    const currency = await this.currencyRepo.findById(currencyId);
    if (!currency) {
      throw new ValidationError(`Currency not found: ${currencyId}`);
    }
    
    // If usdValue exists, return it
    if (currency.usdValue !== null && currency.usdValue !== undefined) {
      return currency;
    }
    
    // Check if API calls are allowed (rate limiting)
    const canFetchRates = await this.rateService.canFetchRateForCurrency(currency.code);
    
    if (!canFetchRates) {
      logger.info("API rate limit cooldown active, skipping rate fetch", {
        currencyId,
        code: currency.code
      });
      // Return currency without usdValue - value will be stored in totalValueExtra
      return currency;
    }
    
    // Try to fetch rates (respects rate limiting internally)
    logger.info("Currency missing usdValue, fetching rates", { currencyId, code: currency.code });
    
    try {
      // Fetch rates (this will skip APIs in cooldown)
      const ratesResult = await this.rateService.fetchAllRates();
      logger.info("Rates fetched", {
        rateCount: ratesResult.usdRates.size,
        errors: ratesResult.errors,
        hasUsd: ratesResult.usdRates.has("USD"),
        hasXau: ratesResult.usdRates.has("XAU"),
        requestedCurrency: currency.code,
        hasRequestedRate: ratesResult.usdRates.has(currency.code),
      });
      
      // Get the usdValue for this currency from the fresh rates
      const usdValue = ratesResult.usdRates.get(currency.code);
      
      if (usdValue !== undefined && usdValue !== null) {
        // Update the database in the background
        this.rateService.updateCurrencyValues().catch(err => {
          logger.error("Background rate update failed", { currencyId }, err instanceof Error ? err : new Error(String(err)));
        });
        
        // Clear the currency cache
        const { currencyCache } = await import("../shared/cache");
        currencyCache.clear();
        
        logger.info("Currency rate found", { code: currency.code, usdValue });
        
        // Return the currency with the fresh usdValue
        return {
          ...currency,
          usdValue,
        };
      }
      
      // Rate not available from APIs - return currency without usdValue
      // The caller will handle storing in totalValueExtra
      logger.warn("Currency rate not available from APIs, value will be stored in totalValueExtra", { code: currency.code, currencyId });
      return currency;
      
    } catch (error) {
      // Log error but return currency without usdValue
      logger.error("Failed to fetch rates, value will be stored in totalValueExtra", { currencyId }, error instanceof Error ? error : new Error(String(error)));
      return currency;
    }
  }

  /**
   * Add a single sadaqah to a box
   * If conversion is not possible, stores value in totalValueExtra
   */
  async addSadaqah(
    boxId: string,
    input: AddSadaqahInput,
    userId: string
  ): Promise<AddSadaqahResult | null> {
    // Verify box ownership and get with relations for baseCurrency
    const box = await this.boxRepo.findByIdWithRelations(boxId, userId);
    if (!box) return null;

    // Calculate value
    const value = input.value ?? input.amount ?? DEFAULT_SADAQAH_VALUE;

    // Use provided currency ID or fall back to box's base currency
    const currencyId = input.currencyId || box.baseCurrencyId || "cur_default";

    // Get currencies for conversion (with rate fetching if needed)
    const sadaqahCurrency = await this.getCurrencyWithRate(currencyId);
    
    // Get base currency with rate
    let baseCurrency: { id: string; code: string; name: string; usdValue?: number | null };
    if (box.baseCurrency) {
      // baseCurrency from box already has usdValue from the relation
      baseCurrency = {
        id: box.baseCurrency.id,
        code: box.baseCurrency.code,
        name: box.baseCurrency.name,
        usdValue: box.baseCurrency.usdValue ?? null,
      };
      // If usdValue is missing, try to fetch it
      if (baseCurrency.usdValue === null && box.baseCurrencyId) {
        baseCurrency = await this.getCurrencyWithRate(box.baseCurrencyId);
      }
    } else if (box.baseCurrencyId) {
      baseCurrency = await this.getCurrencyWithRate(box.baseCurrencyId);
    } else {
      throw new ValidationError("Box has no base currency set");
    }
    
    // Determine if we can convert
    let valueInBaseCurrency: number | null = null;
    let shouldStoreInExtra = false;
    
    if (currencyId === box.baseCurrencyId) {
      // Same currency, no conversion needed
      valueInBaseCurrency = value;
    } else if (!sadaqahCurrency.usdValue || !baseCurrency.usdValue) {
      // Cannot convert - store in totalValueExtra
      shouldStoreInExtra = true;
      logger.info("Cannot convert currency, storing in totalValueExtra", {
        sadaqahCurrency: sadaqahCurrency.code,
        sadaqahUsdValue: sadaqahCurrency.usdValue,
        baseCurrency: baseCurrency.code,
        baseUsdValue: baseCurrency.usdValue,
        value,
      });
    } else {
      // Can convert
      const converted = convertCurrency(value, sadaqahCurrency, baseCurrency);
      if (converted === null) {
        shouldStoreInExtra = true;
        logger.info("Conversion returned null, storing in totalValueExtra", {
          sadaqahCurrency: sadaqahCurrency.code,
          baseCurrency: baseCurrency.code,
          value,
        });
      } else {
        valueInBaseCurrency = converted;
        logger.info("Converted sadaqah value", {
          originalValue: value,
          originalCurrency: sadaqahCurrency.code,
          convertedValue: valueInBaseCurrency,
          baseCurrency: baseCurrency.code,
          sadaqahUsdValue: sadaqahCurrency.usdValue,
          baseUsdValue: baseCurrency.usdValue,
        });
      }
    }

    const timestamp = new Date();
    const id = generateSadaqahId();

    // Create sadaqah and update box counters in a transaction
    await dbBatch(this.db, async (b) => {
      b.add(this.db.insert(sadaqahs).values({
        id,
        boxId,
        value,
        currencyId,
        userId,
        createdAt: timestamp,
      }));

      const newCount = box.count + 1;
      const boxCurrencyId = box.currencyId || currencyId;

      if (shouldStoreInExtra) {
        // Store in totalValueExtra
        const currentExtra = box.totalValueExtra || {};
        const existingEntry = currentExtra[currencyId];
        const newTotal = (existingEntry?.total || 0) + value;
        
        const newTotalValueExtra: TotalValueExtra = {
          ...currentExtra,
          [currencyId]: {
            total: newTotal,
            code: sadaqahCurrency.code,
            name: sadaqahCurrency.name,
          },
        };

        b.add(this.db.update(boxes).set({
          count: newCount,
          totalValueExtra: newTotalValueExtra,
          currencyId: boxCurrencyId,
          updatedAt: timestamp,
        }).where(eq(boxes.id, boxId)));
      } else {
        // Normal update with converted value
        const newTotalValue = box.totalValue + (valueInBaseCurrency || 0);
        b.add(this.db.update(boxes).set({
          count: newCount,
          totalValue: newTotalValue,
          currencyId: boxCurrencyId,
          updatedAt: timestamp,
        }).where(eq(boxes.id, boxId)));
      }
    });

    // Get updated box
    const updatedBox = await this.boxRepo.findByIdWithRelations(boxId, userId);

    return {
      sadaqah: {
        id,
        boxId,
        value,
        currencyId,
        userId,
        createdAt: timestamp.toISOString(),
      },
      updatedBox: updatedBox!,
    };
  }

  /**
   * Add multiple sadaqahs at once (batch operation)
   * If conversion is not possible, stores value in totalValueExtra
   */
  async addMultiple(
    boxId: string,
    input: AddSadaqahInput,
    userId: string
  ): Promise<AddSadaqahResult | null> {
    // Verify box ownership
    const box = await this.boxRepo.findByIdWithRelations(boxId, userId);
    if (!box) return null;

    const amount = Math.min(
      Math.max(1, input.amount || DEFAULT_SADAQAH_AMOUNT),
      MAX_SADAQAH_AMOUNT
    );
    const valuePerUnit = input.value || DEFAULT_SADAQAH_VALUE;
    const totalValue = valuePerUnit * amount;

    const currencyId = input.currencyId || box.baseCurrencyId || "cur_default";

    // Get currencies for conversion (with rate fetching if needed)
    const sadaqahCurrency = await this.getCurrencyWithRate(currencyId);
    
    // Get base currency with rate
    let baseCurrency: { id: string; code: string; name: string; usdValue?: number | null };
    if (box.baseCurrency) {
      baseCurrency = {
        id: box.baseCurrency.id,
        code: box.baseCurrency.code,
        name: box.baseCurrency.name,
        usdValue: box.baseCurrency.usdValue ?? null,
      };
      if (baseCurrency.usdValue === null && box.baseCurrencyId) {
        baseCurrency = await this.getCurrencyWithRate(box.baseCurrencyId);
      }
    } else if (box.baseCurrencyId) {
      baseCurrency = await this.getCurrencyWithRate(box.baseCurrencyId);
    } else {
      throw new ValidationError("Box has no base currency set");
    }
    
    // Determine if we can convert
    let totalValueInBaseCurrency: number | null = null;
    let shouldStoreInExtra = false;
    
    if (currencyId === box.baseCurrencyId) {
      // Same currency, no conversion needed
      totalValueInBaseCurrency = totalValue;
    } else if (!sadaqahCurrency.usdValue || !baseCurrency.usdValue) {
      // Cannot convert - store in totalValueExtra
      shouldStoreInExtra = true;
      logger.info("Cannot convert currency (batch), storing in totalValueExtra", {
        sadaqahCurrency: sadaqahCurrency.code,
        sadaqahUsdValue: sadaqahCurrency.usdValue,
        baseCurrency: baseCurrency.code,
        baseUsdValue: baseCurrency.usdValue,
        totalValue,
      });
    } else {
      // Can convert
      const converted = convertCurrency(totalValue, sadaqahCurrency, baseCurrency);
      if (converted === null) {
        shouldStoreInExtra = true;
        logger.info("Conversion returned null (batch), storing in totalValueExtra", {
          sadaqahCurrency: sadaqahCurrency.code,
          baseCurrency: baseCurrency.code,
          totalValue,
        });
      } else {
        totalValueInBaseCurrency = converted;
        logger.info("Converted sadaqah value (batch)", {
          originalValue: totalValue,
          originalCurrency: sadaqahCurrency.code,
          convertedValue: totalValueInBaseCurrency,
          baseCurrency: baseCurrency.code,
        });
      }
    }

    const timestamp = new Date();
    const id = generateSadaqahId();

    // Create sadaqah and update box counters
    await dbBatch(this.db, async (b) => {
      b.add(this.db.insert(sadaqahs).values({
        id,
        boxId,
        value: totalValue,
        currencyId,
        userId,
        createdAt: timestamp,
      }));

      const newCount = box.count + 1;
      const boxCurrencyId = box.currencyId || currencyId;

      if (shouldStoreInExtra) {
        // Store in totalValueExtra
        const currentExtra = box.totalValueExtra || {};
        const existingEntry = currentExtra[currencyId];
        const newTotal = (existingEntry?.total || 0) + totalValue;
        
        const newTotalValueExtra: TotalValueExtra = {
          ...currentExtra,
          [currencyId]: {
            total: newTotal,
            code: sadaqahCurrency.code,
            name: sadaqahCurrency.name,
          },
        };

        b.add(this.db.update(boxes).set({
          count: newCount,
          totalValueExtra: newTotalValueExtra,
          currencyId: boxCurrencyId,
          updatedAt: timestamp,
        }).where(eq(boxes.id, boxId)));
      } else {
        // Normal update with converted value
        const newTotalValue = box.totalValue + (totalValueInBaseCurrency || 0);
        b.add(this.db.update(boxes).set({
          count: newCount,
          totalValue: newTotalValue,
          currencyId: boxCurrencyId,
          updatedAt: timestamp,
        }).where(eq(boxes.id, boxId)));
      }
    });

    // Get updated box
    const updatedBox = await this.boxRepo.findByIdWithRelations(boxId, userId);

    return {
      sadaqah: {
        id,
        boxId,
        value: totalValue,
        currencyId,
        userId,
        createdAt: timestamp.toISOString(),
      },
      updatedBox: updatedBox!,
    };
  }

  /**
   * List sadaqahs for a box with pagination
   */
  async listSadaqahs(
    boxId: string,
    options: ListSadaqahsOptions = {},
    userId?: string
  ): Promise<{ sadaqahs: Sadaqah[]; total: number }> {
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, from, to } = options;

    // Verify box ownership if userId provided
    if (userId) {
      const box = await this.boxRepo.findById(boxId, userId);
      if (!box) {
        return { sadaqahs: [], total: 0 };
      }
    }

    const result = await this.sadaqahRepo.findByBoxIdWithRelations(boxId, { page, limit, from, to });
    return {
      sadaqahs: result.sadaqahs,
      total: result.total,
    };
  }

  /**
   * Delete a sadaqah
   * Handles both totalValue and totalValueExtra
   */
  async deleteSadaqah(
    sadaqahId: string,
    userId: string
  ): Promise<DeleteSadaqahResult> {
    // First get the sadaqah to find its boxId
    const sadaqah = await this.sadaqahRepo.findById(sadaqahId);
    if (!sadaqah || sadaqah.userId !== userId) {
      return { deleted: false };
    }

    // Get the box with relations for baseCurrency
    const box = await this.boxRepo.findByIdWithRelations(sadaqah.boxId);
    if (!box) {
      return { deleted: false };
    }

    // Check if this sadaqah was stored in totalValueExtra
    const extraEntry = box.totalValueExtra?.[sadaqah.currencyId];
    const wasStoredInExtra = extraEntry !== undefined;

    // Get currencies for conversion (with rate fetching if needed)
    const sadaqahCurrency = await this.getCurrencyWithRate(sadaqah.currencyId).catch(() => null);
    
    // Get base currency with rate
    let baseCurrency: { id: string; code: string; name: string; usdValue?: number | null } | null = null;
    if (box.baseCurrency) {
      baseCurrency = {
        id: box.baseCurrency.id,
        code: box.baseCurrency.code,
        name: box.baseCurrency.name,
        usdValue: box.baseCurrency.usdValue ?? null,
      };
      if (baseCurrency.usdValue === null && box.baseCurrencyId) {
        baseCurrency = await this.getCurrencyWithRate(box.baseCurrencyId).catch(() => null);
      }
    } else if (box.baseCurrencyId) {
      baseCurrency = await this.getCurrencyWithRate(box.baseCurrencyId).catch(() => null);
    }
    
    // Determine if we should subtract from totalValueExtra or totalValue
    let shouldSubtractFromExtra = wasStoredInExtra;
    
    // If not in extra, check if conversion is possible
    let valueInBaseCurrency: number | null = null;
    if (!shouldSubtractFromExtra) {
      if (sadaqah.currencyId === box.baseCurrencyId) {
        valueInBaseCurrency = sadaqah.value;
      } else if (sadaqahCurrency && baseCurrency && sadaqahCurrency.usdValue && baseCurrency.usdValue) {
        const converted = convertCurrency(sadaqah.value, sadaqahCurrency, baseCurrency);
        if (converted !== null) {
          valueInBaseCurrency = converted;
        } else {
          // Conversion not possible now, but might have been when added
          // Check if it's in extra
          shouldSubtractFromExtra = true;
        }
      } else {
        // No conversion possible, check if it's in extra
        shouldSubtractFromExtra = true;
      }
    }

    // Delete sadaqah and update box counters in a transaction
    await dbBatch(this.db, async (b) => {
      b.add(this.db.delete(sadaqahs).where(eq(sadaqahs.id, sadaqahId)));

      const newCount = Math.max(0, box.count - 1);

      if (shouldSubtractFromExtra && box.totalValueExtra) {
        // Subtract from totalValueExtra
        const currentExtra = { ...box.totalValueExtra };
        const currentEntry = currentExtra[sadaqah.currencyId];
        
        if (currentEntry) {
          const newTotal = currentEntry.total - sadaqah.value;
          if (newTotal <= 0) {
            delete currentExtra[sadaqah.currencyId];
          } else {
            currentExtra[sadaqah.currencyId] = {
              ...currentEntry,
              total: newTotal,
            };
          }
        }
        
        const newTotalValueExtra = Object.keys(currentExtra).length > 0 ? currentExtra : null;
        
        b.add(this.db.update(boxes).set({
          count: newCount,
          totalValueExtra: newTotalValueExtra,
          updatedAt: new Date(),
        }).where(eq(boxes.id, sadaqah.boxId)));
      } else {
        // Subtract from totalValue
        const newTotalValue = Math.max(0, box.totalValue - (valueInBaseCurrency || 0));

        b.add(this.db.update(boxes).set({
          count: newCount,
          totalValue: newTotalValue,
          updatedAt: new Date(),
        }).where(eq(boxes.id, sadaqah.boxId)));
      }
    });

    // Get updated box
    const updatedBox = await this.boxRepo.findByIdWithRelations(sadaqah.boxId, userId);

    return { deleted: true, updatedBox: updatedBox || undefined };
  }

  /**
   * Get a single sadaqah by ID
   */
  async getSadaqah(sadaqahId: string, userId?: string): Promise<Sadaqah | null> {
    const sadaqah = await this.sadaqahRepo.findByIdWithRelations(sadaqahId);
    
    if (!sadaqah) return null;
    
    // Verify ownership if userId provided
    if (userId && sadaqah.userId !== userId) {
      return null;
    }
    
    return sadaqah;
  }
}

export const getSadaqahService = createServiceFactory(SadaqahService);
