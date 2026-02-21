/**
 * Tag endpoints - Refactored
 *
 * Uses CRUD factory for standard operations.
 */

import { z } from "@hono/zod-openapi";
import { requireAuth, requireAdmin } from "../middleware";
import { getTagEntity } from "../entities";
import { TagSchema, CreateTagBodySchema } from "../dtos";
import { createCrud } from "../shared/crud-factory";
import type { RouteDefinition } from "../shared/route-builder";
import type { TagDto, CreateTagBodyDto } from "../dtos";

const tagCrud = createCrud<TagDto, CreateTagBodyDto>({
	resourceName: "Tag",
	tagName: "Tags",
	path: "/api/tags",
	idParam: "tagId",
	itemsKey: "tags",
	schemas: {
		item: TagSchema,
		create: CreateTagBodySchema,
	},
	getEntity: getTagEntity,
	getCreateInput: (body) => body as CreateTagBodyDto,
	checkDuplicate: { field: "name", method: "getByName" },
	auth: {
		list: true,
		create: true,
		get: true,
		delete: true,
	},
});

export const tagRouteDefinitions: RouteDefinition[] = tagCrud.routes.map(r => {
	// Auth required for read operations (list, get)
	// Admin required for write operations (create, delete)
	const isWriteOperation = r.route.method === "post" || r.route.method === "delete";
	if (isWriteOperation) {
		return {
			...r,
			middleware: [requireAuth, requireAdmin],
		};
	}
	// Read operations require authentication
	return {
		...r,
		middleware: [requireAuth],
	};
});

// Re-export for direct use if needed
export const {
	listRoute,
	createRoute,
	getRoute,
	deleteRoute,
	listHandler,
	createHandler,
	getHandler,
	deleteHandler,
} = tagCrud;
