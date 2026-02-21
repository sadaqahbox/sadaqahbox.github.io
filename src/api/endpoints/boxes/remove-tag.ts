import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { getTagEntity } from "../../entities/tag";
import { successResponse, jsonError } from "../../lib/response";

export class BoxRemoveTag extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Remove a tag from a box",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
				tagId: Str({ description: "Tag ID to remove" }),
			}),
		},
		responses: {
			"200": {
				description: "Tag removed successfully",
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
				description: "Box or tag not found",
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
		const { boxId, tagId } = data.params;

		// Verify box exists
		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.get(boxId);
		if (!box) {
			return jsonError("Box not found", 404);
		}

		// Verify tag exists
		const tagEntity = getTagEntity(c);
		const tag = await tagEntity.get(tagId);
		if (!tag) {
			return jsonError("Tag not found", 404);
		}

		// Remove tag from box
		await boxEntity.removeTag(boxId, tagId);

		return successResponse({
			message: `Tag "${tag.name}" removed from box`,
		});
	}
}
