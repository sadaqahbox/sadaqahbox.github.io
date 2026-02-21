import type { AppContext } from "./types";
import { BoxSchema, type Box, type Collection, generateBoxId, generateCollectionId } from "./types";
import { mapBox } from "../lib/mappers";
import type { PrismaClientType } from "../lib/prisma";
import { getPrismaFromContext } from "../lib/prisma";

export { BoxSchema, type Box };

export interface BoxStats {
	firstSadaqahAt: string | null;
	lastSadaqahAt: string | null;
	uniqueLocations: number;
}

export interface CollectionResult {
	box: Box;
	collection: {
		id: string;
		sadaqahsCollected: number;
		totalValue: number;
		currency: string;
		emptiedAt: string;
	};
}

export interface CollectionsListResult {
	collections: Collection[];
	total: number;
}

export interface DeleteBoxResult {
	deleted: boolean;
	sadaqahsDeleted: number;
	collectionsDeleted: number;
}

/**
 * Entity class for managing charity boxes
 */
export class BoxEntity {
	constructor(private prisma: PrismaClientType) {}

	// ============== CRUD Operations ==============

	async create(data: { name: string; description?: string }): Promise<Box> {
		const timestamp = new Date();

		const box = await this.prisma.box.create({
			data: {
				id: generateBoxId(),
				name: data.name,
				description: data.description || null,
				count: 0,
				totalValue: 0,
				currency: null,
				createdAt: timestamp,
				updatedAt: timestamp,
			},
		});

		return mapBox(box);
	}

	async get(id: string): Promise<Box | null> {
		const box = await this.prisma.box.findUnique({
			where: { id },
		});

		return box ? mapBox(box) : null;
	}

	async list(): Promise<Box[]> {
		const boxes = await this.prisma.box.findMany({
			orderBy: { createdAt: "desc" },
		});

		return boxes.map(mapBox);
	}

	async update(id: string, updates: Partial<Box>): Promise<Box | null> {
		const box = await this.prisma.box.update({
			where: { id },
			data: {
				...updates,
				updatedAt: new Date(),
			},
		});

		return mapBox(box);
	}

	async delete(id: string): Promise<DeleteBoxResult> {
		// Get counts before deletion
		const [sadaqahCount, collectionCount] = await Promise.all([
			this.prisma.sadaqah.count({ where: { boxId: id } }),
			this.prisma.collection.count({ where: { boxId: id } }),
		]);

		// Delete box (cascades to sadaqahs and collections via foreign key)
		await this.prisma.box.delete({
			where: { id },
		});

		return {
			deleted: true,
			sadaqahsDeleted: sadaqahCount,
			collectionsDeleted: collectionCount,
		};
	}

	// ============== Stats ==============

	async getStats(id: string): Promise<BoxStats | null> {
		const box = await this.prisma.box.findUnique({
			where: { id },
		});

		if (!box) return null;

		const sadaqahs = await this.prisma.sadaqah.findMany({
			where: { boxId: id },
			select: { createdAt: true, location: true },
			orderBy: { createdAt: "asc" },
		});

		if (sadaqahs.length === 0) {
			return { firstSadaqahAt: null, lastSadaqahAt: null, uniqueLocations: 0 };
		}

		const locations = new Set(sadaqahs.filter((s) => s.location).map((s) => s.location!));

		return {
			firstSadaqahAt: sadaqahs[0].createdAt.toISOString(),
			lastSadaqahAt: sadaqahs[sadaqahs.length - 1].createdAt.toISOString(),
			uniqueLocations: locations.size,
		};
	}

	// ============== Collection (Empty Box) ==============

	async collect(id: string): Promise<CollectionResult | null> {
		const box = await this.prisma.box.findUnique({
			where: { id },
		});

		if (!box) return null;

		const timestamp = new Date();

		// Create collection record
		const collection = await this.prisma.collection.create({
			data: {
				id: generateCollectionId(),
				boxId: id,
				emptiedAt: timestamp,
				sadaqahsCollected: box.count,
				totalValue: box.totalValue,
				currency: box.currency || "USD",
			},
		});

		// Delete all sadaqahs in the box
		await this.prisma.sadaqah.deleteMany({
			where: { boxId: id },
		});

		// Reset box
		const updatedBox = await this.prisma.box.update({
			where: { id },
			data: {
				count: 0,
				totalValue: 0,
				currency: null,
				updatedAt: timestamp,
			},
		});

		return {
			box: mapBox(updatedBox),
			collection: {
				id: collection.id,
				sadaqahsCollected: collection.sadaqahsCollected,
				totalValue: collection.totalValue,
				currency: collection.currency,
				emptiedAt: collection.emptiedAt.toISOString(),
			},
		};
	}

	// ============== Collections List ==============

	async getCollections(
		boxId: string,
		options?: { page?: number; limit?: number }
	): Promise<CollectionsListResult> {
		const page = options?.page || 1;
		const limit = options?.limit || 20;

		const [collections, total] = await Promise.all([
			this.prisma.collection.findMany({
				where: { boxId },
				orderBy: { emptiedAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			this.prisma.collection.count({ where: { boxId } }),
		]);

		return {
			collections: collections.map((c) => ({
				id: c.id,
				boxId: c.boxId,
				emptiedAt: c.emptiedAt.toISOString(),
				sadaqahsCollected: c.sadaqahsCollected,
				totalValue: c.totalValue,
				currency: c.currency,
			})),
			total,
		};
	}
}

// Factory function for creating BoxEntity from context
export function getBoxEntity(c: AppContext): BoxEntity {
	return new BoxEntity(getPrismaFromContext(c));
}
