import type { Box, Sadaqah } from "../entities/types";

// ============== Prisma to Domain Mappers ==============
// These functions convert Prisma results to domain types with string dates

interface PrismaBox {
	id: string;
	name: string;
	description: string | null;
	count: number;
	totalValue: number;
	currency: string | null;
	createdAt: Date;
	updatedAt: Date;
}

interface PrismaSadaqah {
	id: string;
	boxId: string;
	value: number;
	currency: string;
	createdAt: Date;
	location: string | null;
	ipAddress: string | null;
	userAgent: string | null;
}

/**
 * Maps a Prisma Box to the domain Box type with ISO string dates
 */
export function mapBox(box: PrismaBox): Box {
	return {
		id: box.id,
		name: box.name,
		description: box.description || undefined,
		count: box.count,
		totalValue: box.totalValue,
		currency: box.currency || undefined,
		createdAt: box.createdAt.toISOString(),
		updatedAt: box.updatedAt.toISOString(),
	};
}

/**
 * Maps a Prisma Sadaqah to the domain Sadaqah type with ISO string dates
 */
export function mapSadaqah(sadaqah: PrismaSadaqah): Sadaqah {
	return {
		id: sadaqah.id,
		boxId: sadaqah.boxId,
		value: sadaqah.value,
		currency: sadaqah.currency,
		createdAt: sadaqah.createdAt.toISOString(),
		location: sadaqah.location || undefined,
		ipAddress: sadaqah.ipAddress || undefined,
		userAgent: sadaqah.userAgent || undefined,
	};
}

/**
 * Maps an array of Prisma Boxes to domain Box types
 */
export function mapBoxes(boxes: PrismaBox[]): Box[] {
	return boxes.map(mapBox);
}

/**
 * Maps an array of Prisma Sadaqahs to domain Sadaqah types
 */
export function mapSadaqahs(sadaqahs: PrismaSadaqah[]): Sadaqah[] {
	return sadaqahs.map(mapSadaqah);
}
