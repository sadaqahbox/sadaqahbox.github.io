import type { Box as DomainBox, Sadaqah as DomainSadaqah } from "../entities/types";
import type { Box, Sadaqah } from "../../db/schema";

// ============== Drizzle to Domain Mappers ==============
// These functions convert Drizzle results to domain types with string dates

/**
 * Maps a Drizzle Box to the domain Box type with ISO string dates
 */
export function mapBox(box: Box): DomainBox {
  return {
    id: box.id,
    name: box.name,
    description: box.description || undefined,
    metadata: box.metadata ? (typeof box.metadata === 'string' ? JSON.parse(box.metadata) : box.metadata) : undefined,
    count: box.count,
    totalValue: box.totalValue,
    currencyId: box.currencyId || undefined,
    createdAt: new Date(box.createdAt).toISOString(),
    updatedAt: new Date(box.updatedAt).toISOString(),
  };
}

/**
 * Maps a Drizzle Sadaqah to the domain Sadaqah type with ISO string dates
 */
export function mapSadaqah(sadaqah: Sadaqah): DomainSadaqah {
  return {
    id: sadaqah.id,
    boxId: sadaqah.boxId,
    value: sadaqah.value,
    currencyId: sadaqah.currencyId,
    createdAt: new Date(sadaqah.createdAt).toISOString(),
  };
}

/**
 * Maps an array of Drizzle Boxes to domain Box types
 */
export function mapBoxes(boxes: Box[]): DomainBox[] {
  return boxes.map(mapBox);
}

/**
 * Maps an array of Drizzle Sadaqahs to domain Sadaqah types
 */
export function mapSadaqahs(sadaqahs: Sadaqah[]): DomainSadaqah[] {
  return sadaqahs.map(mapSadaqah);
}
