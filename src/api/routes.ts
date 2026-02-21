import type { fromHono } from "chanfana";
import type { Hono } from "hono";

// Box endpoints
import { BoxList } from "./endpoints/boxes/list";
import { BoxCreate } from "./endpoints/boxes/create";
import { BoxGet } from "./endpoints/boxes/get";
import { BoxUpdate } from "./endpoints/boxes/update";
import { BoxDelete } from "./endpoints/boxes/delete";
import { BoxEmpty } from "./endpoints/boxes/empty";
import { BoxCollections } from "./endpoints/boxes/collections";

// Sadaqah endpoints
import { SadaqahList } from "./endpoints/sadaqahs/list";
import { SadaqahAdd } from "./endpoints/sadaqahs/add";
import { SadaqahGet } from "./endpoints/sadaqahs/get";
import { SadaqahDelete } from "./endpoints/sadaqahs/delete";

// Currency endpoints
import { CurrencyList } from "./endpoints/currencies/list";
import { CurrencyCreate } from "./endpoints/currencies/create";
import { CurrencyGet } from "./endpoints/currencies/get";
import { CurrencyDelete } from "./endpoints/currencies/delete";

// Tag endpoints
import { TagList } from "./endpoints/tags/list";
import { TagCreate } from "./endpoints/tags/create";
import { TagGet } from "./endpoints/tags/get";
import { TagDelete } from "./endpoints/tags/delete";
import { TagBoxes } from "./endpoints/tags/boxes";

// Box tag endpoints
import { BoxAddTag } from "./endpoints/boxes/add-tag";
import { BoxRemoveTag } from "./endpoints/boxes/remove-tag";
import { BoxSetTags } from "./endpoints/boxes/set-tags";

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
