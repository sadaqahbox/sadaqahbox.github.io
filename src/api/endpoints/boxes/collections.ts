import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { CollectionSchema } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { successResponse, jsonError, createPagination } from "../../lib/response";

export class BoxCollections extends OpenAPIRoute {
	schema = {
		tags: ["Collections"],
		summary: "Get collection history for a box",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
			}),
			query: z.object({
				page: Num({ default: 1 }),
				limit: Num({ default: 20 }),
			}),
		},
		responses: {
			"200": {
				description: "Returns collection history",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							boxId: Str(),
							collections: CollectionSchema.array(),
							pagination: z.object({
								page: Num(),
								limit: Num(),
								total: Num(),
								totalPages: Num(),
							}),
							summary: z.object({
								totalCollections: Num(),
								totalSadaqahsCollected: Num(),
								totalValueCollected: Num(),
							}),
						}),
					},
				},
			},
			"404": {
				description: "Box not found",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							error: Str(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;
		const { page, limit } = data.query;

		// Verify box exists
		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.get(boxId);
		if (!box) {
			return jsonError("Box not found", 404);
		}

		// Get collections using BoxEntity
		const { collections, total } = await boxEntity.getCollections(boxId, { page, limit });

		// Calculate summary stats
		const totalSadaqahsCollected = collections.reduce((sum, c) => sum + c.sadaqahsCollected, 0);
		const totalValueCollected = collections.reduce((sum, c) => sum + c.totalValue, 0);

		return successResponse({
			boxId,
			collections,
			pagination: createPagination(page, limit, total),
			summary: {
				totalCollections: total,
				totalSadaqahsCollected,
				totalValueCollected,
			},
		});
	}
}
