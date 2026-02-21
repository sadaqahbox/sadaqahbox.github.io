/**
 * Database to domain mappers
 * Converts Drizzle results to domain types
 */

import type { Box as DbBox, Sadaqah as DbSadaqah } from "../../db/schema";
import type { Box, Sadaqah } from "../domain/types";

export function mapBox(box: DbBox): Box {
	return {
		id: box.id,
		name: box.name,
		description: box.description || undefined,
		metadata: box.metadata 
			? (typeof box.metadata === "string" ? JSON.parse(box.metadata) : box.metadata) 
			: undefined,
		count: box.count,
		totalValue: box.totalValue,
		currencyId: box.currencyId || undefined,
		createdAt: new Date(box.createdAt).toISOString(),
		updatedAt: new Date(box.updatedAt).toISOString(),
	};
}

export function mapSadaqah(sadaqah: DbSadaqah): Sadaqah {
	return {
		id: sadaqah.id,
		boxId: sadaqah.boxId,
		value: sadaqah.value,
		currencyId: sadaqah.currencyId,
		createdAt: new Date(sadaqah.createdAt).toISOString(),
	};
}

export function mapBoxes(boxes: DbBox[]): Box[] {
	return boxes.map(mapBox);
}

export function mapSadaqahs(sadaqahs: DbSadaqah[]): Sadaqah[] {
	return sadaqahs.map(mapSadaqah);
}
