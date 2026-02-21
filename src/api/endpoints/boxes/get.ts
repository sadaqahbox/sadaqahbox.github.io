import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { BoxSchema } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { successResponse, jsonError } from "../../lib/response";

export class BoxGet extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Get a box with detailed stats",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns the box",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							box: BoxSchema,
							stats: z.object({
								firstSadaqahAt: Str().nullable(),
								lastSadaqahAt: Str().nullable(),
								totalSadaqahs: Num(),
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

		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.get(boxId);

		if (!box) {
			return jsonError("Box not found", 404);
		}

		const stats = await boxEntity.getStats(boxId);

		return successResponse({
			box,
			stats,
		});
	}
}
