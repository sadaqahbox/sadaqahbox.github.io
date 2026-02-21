/**
 * Services
 * 
 * Domain services that encapsulate business logic.
 * Services orchestrate entities and handle complex operations.
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
