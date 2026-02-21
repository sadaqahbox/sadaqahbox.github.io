import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { BoxSchema } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { successResponse, jsonError } from "../../lib/response";

export class BoxEmpty extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Empty a box (collect all sadaqahs)",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns the emptied box with collection record",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							box: BoxSchema,
							collection: z.object({
								id: Str(),
								sadaqahsCollected: Num(),
								totalValue: Num(),
								currency: Str(),
								emptiedAt: Str(),
							}),
							message: Str(),
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

		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.get(boxId);

		if (!box) {
			return jsonError("Box not found", 404);
		}

		// Handle already empty box
		if (box.count === 0) {
			return successResponse({
				box,
				collection: {
					id: "",
					sadaqahsCollected: 0,
					totalValue: 0,
					currency: box.currency || "USD",
					emptiedAt: new Date().toISOString(),
				},
				message: "Box is already empty",
			});
		}

		const result = await boxEntity.collect(boxId);

		if (!result) {
			return jsonError("Failed to empty box", 500);
		}

		return successResponse({
			box: result.box,
			collection: result.collection,
			message: `Collected ${result.collection.sadaqahsCollected} sadaqahs worth ${result.collection.totalValue} ${result.collection.currency}!`,
		});
	}
}
