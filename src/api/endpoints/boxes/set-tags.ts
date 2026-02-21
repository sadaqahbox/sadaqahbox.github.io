import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { successResponse, jsonError } from "../../lib/response";

export class BoxSetTags extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Set tags for a box (replaces all existing tags)",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							tagIds: Str().array().describe("Array of tag IDs"),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Tags set successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
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
		const { tagIds } = data.body;

		// Verify box exists
		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.get(boxId);
		if (!box) {
			return jsonError("Box not found", 404);
		}

		// Set tags for box
		await boxEntity.setTags(boxId, tagIds);

		return successResponse({
			message: `Tags updated for box`,
		});
	}
}
