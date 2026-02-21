import type { AppContext } from "./types";
import { SadaqahSchema, type Sadaqah, type Box, generateSadaqahId } from "./types";
import { mapSadaqah, mapBox } from "../lib/mappers";
import type { PrismaClientType } from "../lib/prisma";
import { getPrismaFromContext } from "../lib/prisma";

export { SadaqahSchema, type Sadaqah };

export interface AddSadaqahOptions {
	boxId: string;
	value: number;
	currency: string;
	amount?: number;
	location?: string;
	metadata?: Record<string, string>;
	ipAddress?: string;
	userAgent?: string;
}

export interface CreateSadaqahResult {
	sadaqah: Sadaqah;
	updatedBox: Box;
}

export interface ListSadaqahsResult {
	sadaqahs: Sadaqah[];
	total: number;
	summary: {
		totalSadaqahs: number;
		totalValue: number;
		currency: string;
	};
}

export interface AddMultipleResult {
	sadaqahs: Sadaqah[];
	box: Box;
}

interface SadaqahWhereClause {
	boxId: string;
	createdAt?: {
		gte?: Date;
		lte?: Date;
	};
}

/**
 * Entity class for managing sadaqahs (charity items)
 */
export class SadaqahEntity {
	constructor(private prisma: PrismaClientType) {}

	// ============== CRUD Operations ==============

	async create(data: {
		boxId: string;
		value: number;
		currency: string;
		location?: string;
		ipAddress?: string;
		userAgent?: string;
		metadata?: Record<string, string>;
	}): Promise<CreateSadaqahResult | null> {
		// Get box to verify it exists
		const box = await this.prisma.box.findUnique({
			where: { id: data.boxId },
		});

		if (!box) return null;

		const timestamp = new Date();

		// Create sadaqah
		const sadaqah = await this.prisma.sadaqah.create({
			data: {
				id: generateSadaqahId(),
				boxId: data.boxId,
				value: data.value,
				currency: data.currency,
				createdAt: timestamp,
				location: data.location || null,
				ipAddress: data.ipAddress || null,
				userAgent: data.userAgent || null,
			},
		});

		// Update box stats
		const updatedBox = await this.updateBoxStats(data.boxId, box.count + 1, box.totalValue + data.value, box.currency || data.currency);

		return {
			sadaqah: mapSadaqah(sadaqah),
			updatedBox,
		};
	}

	async get(boxId: string, sadaqahId: string): Promise<Sadaqah | null> {
		const sadaqah = await this.prisma.sadaqah.findUnique({
			where: { id: sadaqahId },
		});

		if (!sadaqah || sadaqah.boxId !== boxId) return null;

		return mapSadaqah(sadaqah);
	}

	async list(
		boxId: string,
		options?: { page?: number; limit?: number; from?: string; to?: string }
	): Promise<ListSadaqahsResult> {
		const page = options?.page || 1;
		const limit = options?.limit || 50;
		const from = options?.from;
		const to = options?.to;

		// Get box for currency info
		const box = await this.prisma.box.findUnique({
			where: { id: boxId },
		});

		const currency = box?.currency || "USD";

		// Build where clause
		const where: SadaqahWhereClause = { boxId };
		if (from || to) {
			where.createdAt = {};
			if (from) where.createdAt.gte = new Date(from);
			if (to) where.createdAt.lte = new Date(to);
		}

		// Fetch sadaqahs with pagination
		const [sadaqahs, total, totalValueAgg] = await Promise.all([
			this.prisma.sadaqah.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			this.prisma.sadaqah.count({ where }),
			this.prisma.sadaqah.aggregate({
				where: { boxId },
				_sum: { value: true },
			}),
		]);

		return {
			sadaqahs: sadaqahs.map(mapSadaqah),
			total,
			summary: {
				totalSadaqahs: total,
				totalValue: totalValueAgg._sum.value || 0,
				currency,
			},
		};
	}

	// ============== Batch Operations ==============

	async addMultiple(options: AddSadaqahOptions): Promise<AddMultipleResult | null> {
		const box = await this.prisma.box.findUnique({
			where: { id: options.boxId },
		});

		if (!box) return null;

		const amount = options.amount || 1;
		const timestamp = new Date();

		// Batch create sadaqahs
		const sadaqahs: Sadaqah[] = [];
		for (let i = 0; i < amount; i++) {
			const sadaqah = await this.prisma.sadaqah.create({
				data: {
					id: generateSadaqahId(i),
					boxId: options.boxId,
					value: options.value,
					currency: options.currency,
					createdAt: timestamp,
					location: options.location || null,
					ipAddress: options.ipAddress || null,
					userAgent: options.userAgent || null,
				},
			});
			sadaqahs.push(mapSadaqah(sadaqah));
		}

		// Update box stats
		const newCount = box.count + amount;
		const newTotalValue = box.totalValue + options.value * amount;
		const currency = box.currency || options.currency;

		const updatedBox = await this.updateBoxStats(options.boxId, newCount, newTotalValue, currency);

		return { sadaqahs, box: updatedBox };
	}

	// ============== Private Helpers ==============

	private async updateBoxStats(
		boxId: string,
		count: number,
		totalValue: number,
		currency: string
	): Promise<Box> {
		const updatedBox = await this.prisma.box.update({
			where: { id: boxId },
			data: {
				count,
				totalValue,
				currency,
				updatedAt: new Date(),
			},
		});

		return mapBox(updatedBox);
	}
}

// Factory function
export function getSadaqahEntity(c: AppContext): SadaqahEntity {
	return new SadaqahEntity(getPrismaFromContext(c));
}
