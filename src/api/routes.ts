/**
 * API Routes
 * 
 * All route registrations are centralized here.
 * Endpoints are grouped by resource for better organization.
 */

import type { fromHono } from "chanfana";
import type { Hono } from "hono";

// Box endpoints
import {
	BoxList,
	BoxCreate,
	BoxGet,
	BoxUpdate,
	BoxDelete,
	BoxEmpty,
	BoxCollections,
	BoxAddTag,
	BoxRemoveTag,
	BoxSetTags,
} from "./endpoints/boxes";

// Sadaqah endpoints
import { SadaqahList, SadaqahAdd, SadaqahGet, SadaqahDelete } from "./endpoints/sadaqahs";

// Currency endpoints
import { CurrencyList, CurrencyCreate, CurrencyGet, CurrencyDelete } from "./endpoints/currencies";

// Currency Type endpoints
import {
	CurrencyTypeList,
	CurrencyTypeCreate,
	CurrencyTypeGet,
	CurrencyTypeDelete,
	CurrencyTypeInitialize,
} from "./endpoints/currency-types";

// Tag endpoints
import { TagList, TagCreate, TagGet, TagDelete, TagBoxes } from "./endpoints/tags";

type OpenAPIInstance = ReturnType<typeof fromHono<Hono<{ Bindings: Env }>>>;

/**
 * Registers all API routes
 */
export function createRoutes(openapi: OpenAPIInstance): void {
	// ============== Box Routes ==============
	openapi.get("/api/boxes", BoxList);
	openapi.post("/api/boxes", BoxCreate);
	openapi.get("/api/boxes/:boxId", BoxGet);
	openapi.patch("/api/boxes/:boxId", BoxUpdate);
	openapi.delete("/api/boxes/:boxId", BoxDelete);
	openapi.post("/api/boxes/:boxId/empty", BoxEmpty);
	openapi.get("/api/boxes/:boxId/collections", BoxCollections);
	openapi.post("/api/boxes/:boxId/tags", BoxAddTag);
	openapi.delete("/api/boxes/:boxId/tags/:tagId", BoxRemoveTag);
	openapi.put("/api/boxes/:boxId/tags", BoxSetTags);

	// ============== Sadaqah Routes ==============
	openapi.get("/api/boxes/:boxId/sadaqahs", SadaqahList);
	openapi.post("/api/boxes/:boxId/sadaqahs", SadaqahAdd);
	openapi.get("/api/boxes/:boxId/sadaqahs/:sadaqahId", SadaqahGet);
	openapi.delete("/api/boxes/:boxId/sadaqahs/:sadaqahId", SadaqahDelete);

	// ============== Currency Type Routes ==============
	openapi.get("/api/currency-types", CurrencyTypeList);
	openapi.post("/api/currency-types", CurrencyTypeCreate);
	openapi.get("/api/currency-types/:currencyTypeId", CurrencyTypeGet);
	openapi.delete("/api/currency-types/:currencyTypeId", CurrencyTypeDelete);
	openapi.post("/api/currency-types/initialize", CurrencyTypeInitialize);

	// ============== Currency Routes ==============
	openapi.get("/api/currencies", CurrencyList);
	openapi.post("/api/currencies", CurrencyCreate);
	openapi.get("/api/currencies/:currencyId", CurrencyGet);
	openapi.delete("/api/currencies/:currencyId", CurrencyDelete);

	// ============== Tag Routes ==============
	openapi.get("/api/tags", TagList);
	openapi.post("/api/tags", TagCreate);
	openapi.get("/api/tags/:tagId", TagGet);
	openapi.delete("/api/tags/:tagId", TagDelete);
	openapi.get("/api/tags/:tagId/boxes", TagBoxes);
}
