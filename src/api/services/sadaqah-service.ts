/**
 * Sadaqah Service
 *
 * Business logic for sadaqah operations.
 */

import { eq } from "drizzle-orm";
import { BaseService, createServiceFactory } from "./base-service";
import { SadaqahEntity, BoxEntity } from "../entities";
import { sadaqahs } from "../../db/schema";
import type { SadaqahDto, BoxDto } from "../dtos";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "../config/constants";

export interface AddSadaqahInput {
	amount?: number;
	value?: number;
	currencyId?: string;
	metadata?: Record<string, string>;
}

export interface ListSadaqahsOptions {
	page?: number;
	limit?: number;
}

export interface AddSadaqahResult {
	sadaqah: SadaqahDto;
	updatedBox: BoxDto;
}

export interface DeleteSadaqahResult {
	deleted: boolean;
	updatedBox?: BoxDto;
}

export class SadaqahService extends BaseService {
	private get sadaqahEntity() {
		return new SadaqahEntity(this.db);
	}

	private get boxEntity() {
		return new BoxEntity(this.db);
	}

	async addSadaqah(
		boxId: string,
		input: AddSadaqahInput,
		userId: string
	): Promise<AddSadaqahResult | null> {
		// Verify box ownership
		const box = await this.boxEntity.get(boxId, userId);
		if (!box) return null;

		// Calculate value
		const value = input.value ?? input.amount ?? 1;

		// Use provided currency ID or fall back to box's currency
		const currencyId = input.currencyId || box.currencyId || "cur_default";

		const result = await this.sadaqahEntity.create({
			boxId,
			value,
			currencyId,
			userId,
		});

		if (!result) return null;

		return {
			sadaqah: result.sadaqah,
			updatedBox: result.updatedBox,
		};
	}

	async listSadaqahs(
		boxId: string,
		options: ListSadaqahsOptions = {}
	): Promise<{ sadaqahs: SadaqahDto[]; total: number }> {
		const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = options;
		return this.sadaqahEntity.listByBox(boxId, page, limit);
	}

	async deleteSadaqah(
		sadaqahId: string,
		userId: string
	): Promise<DeleteSadaqahResult> {
		// First get the sadaqah to find its boxId
		const sadaqahResult = await this.db
			.select()
			.from(sadaqahs)
			.where(eq(sadaqahs.id, sadaqahId))
			.limit(1);
		
		const sadaqah = sadaqahResult[0];
		if (!sadaqah || sadaqah.userId !== userId) {
			return { deleted: false };
		}

		// Use entity delete which handles the transaction
		const deleted = await this.sadaqahEntity.delete(sadaqah.boxId, sadaqahId, userId);
		
		if (!deleted) {
			return { deleted: false };
		}

		// Get updated box
		const updatedBox = await this.boxEntity.get(sadaqah.boxId, userId);
		
		return { deleted: true, updatedBox: updatedBox || undefined };
	}
}

export const getSadaqahService = createServiceFactory(SadaqahService);
