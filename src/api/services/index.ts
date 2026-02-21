/**
 * Services
 * 
 * Domain services that encapsulate business logic.
 * Services orchestrate repositories and handle complex operations.
 * 
 * @module api/services
 */

export { BaseService, createServiceFactory, type ServiceFactory } from "./base-service";

// Box service
export {
	BoxService,
	getBoxService,
	type CreateBoxInput,
	type UpdateBoxInput,
	type ListBoxesOptions,
	type ListCollectionsOptions,
} from "./box-service";

// Sadaqah service
export {
	SadaqahService,
	getSadaqahService,
	type AddSadaqahInput,
	type ListSadaqahsOptions,
	type AddSadaqahResult,
} from "./sadaqah-service";

// Currency service
export {
	CurrencyService,
	getCurrencyService,
	type CreateCurrencyInput,
	type UpdateCurrencyInput,
} from "./currency-service";

// Currency Type service
export {
	CurrencyTypeService,
	getCurrencyTypeService,
	type CreateCurrencyTypeInput,
	type UpdateCurrencyTypeInput,
} from "./currency-type-service";

// Tag service
export {
	TagService,
	getTagService,
	type CreateTagInput,
	type UpdateTagInput,
	type ListTagsOptions,
} from "./tag-service";

// Collection service
export {
	CollectionService,
	getCollectionService,
	type ListCollectionsOptions as ListUserCollectionsOptions,
	type CreateCollectionInput,
} from "./collection-service";
