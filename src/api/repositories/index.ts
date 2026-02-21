/**
 * Repository Layer Exports
 * 
 * Pure data access layer - no business logic.
 * Each repository handles database operations for a specific entity.
 * 
 * @module api/repositories
 */

// Box Repository
export {
  BoxRepository,
  type BoxRecord,
  type CreateBoxData,
  type UpdateBoxData,
  type BoxWithRelations,
} from "./box.repository";

// Sadaqah Repository
export {
  SadaqahRepository,
  type SadaqahRecord,
  type CreateSadaqahData,
  type SadaqahWithRelations,
} from "./sadaqah.repository";

// Currency Repository
export {
  CurrencyRepository,
  type CurrencyRecord,
  type CreateCurrencyData,
  type CurrencyWithRelations,
} from "./currency.repository";

// Tag Repository
export {
  TagRepository,
  type TagRecord,
  type CreateTagData,
  type TagWithRelations,
} from "./tag.repository";

// Currency Type Repository
export {
  CurrencyTypeRepository,
  type CurrencyTypeRecord,
  type CreateCurrencyTypeData,
  type CurrencyTypeWithRelations,
} from "./currency-type.repository";

// Collection Repository
export {
  CollectionRepository,
  type CollectionRecord,
  type CreateCollectionData,
  type CollectionWithRelations,
} from "./collection.repository";
