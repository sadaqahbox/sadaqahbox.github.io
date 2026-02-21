/**
 * Sadaqah Service
 *
 * Business logic for sadaqah operations.
 * Uses Repository pattern for data access.
 */

import { eq, sql } from "drizzle-orm";
import { BaseService, createServiceFactory } from "./base-service";
import { SadaqahRepository, BoxRepository, CurrencyRepository } from "../repositories";
import { sadaqahs, boxes } from "../../db/schema";
import type { Sadaqah, Box } from "../schemas";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../config/constants";
import { DEFAULT_SADAQAH_VALUE, DEFAULT_SADAQAH_AMOUNT, MAX_SADAQAH_AMOUNT } from "../domain/constants";
import { generateSadaqahId } from "../shared/id-generator";
import { dbBatch } from "../shared/transaction";
import { SadaqahNotFoundError, BoxNotFoundError, ValidationError } from "../errors";

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

  /**
   * Add a single sadaqah to a box
   */
  async addSadaqah(
    boxId: string,
    input: AddSadaqahInput,
    userId: string
  ): Promise<AddSadaqahResult | null> {
    // Verify box ownership
    const box = await this.boxRepo.findById(boxId, userId);
    if (!box) return null;

    // Calculate value
    const value = input.value ?? input.amount ?? DEFAULT_SADAQAH_VALUE;

    // Use provided currency ID or fall back to box's currency
    const currencyId = input.currencyId || box.currencyId || "cur_default";

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
      const newTotalValue = box.totalValue + value;
      const boxCurrencyId = box.currencyId || currencyId;

      b.add(this.db.update(boxes).set({
        count: newCount,
        totalValue: newTotalValue,
        currencyId: boxCurrencyId,
        updatedAt: timestamp,
      }).where(eq(boxes.id, boxId)));
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
   */
  async addMultiple(
    boxId: string,
    input: AddSadaqahInput,
    userId: string
  ): Promise<AddSadaqahResult | null> {
    // Verify box ownership
    const box = await this.boxRepo.findById(boxId, userId);
    if (!box) return null;

    const amount = Math.min(
      Math.max(1, input.amount || DEFAULT_SADAQAH_AMOUNT),
      MAX_SADAQAH_AMOUNT
    );
    const valuePerUnit = input.value || DEFAULT_SADAQAH_VALUE;
    const totalValue = valuePerUnit * amount;

    const currencyId = input.currencyId || box.currencyId || "cur_default";

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
      const newTotalValue = box.totalValue + totalValue;
      const boxCurrencyId = box.currencyId || currencyId;

      b.add(this.db.update(boxes).set({
        count: newCount,
        totalValue: newTotalValue,
        currencyId: boxCurrencyId,
        updatedAt: timestamp,
      }).where(eq(boxes.id, boxId)));
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

    // Get the box
    const box = await this.boxRepo.findById(sadaqah.boxId);
    if (!box) {
      return { deleted: false };
    }

    // Delete sadaqah and update box counters in a transaction
    await dbBatch(this.db, async (b) => {
      b.add(this.db.delete(sadaqahs).where(eq(sadaqahs.id, sadaqahId)));

      const newCount = Math.max(0, box.count - 1);
      const newTotalValue = Math.max(0, box.totalValue - sadaqah.value);

      b.add(this.db.update(boxes).set({
        count: newCount,
        totalValue: newTotalValue,
        updatedAt: new Date(),
      }).where(eq(boxes.id, sadaqah.boxId)));
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
