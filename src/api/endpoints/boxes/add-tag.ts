import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { getTagEntity } from "../../entities/tag";
import { successResponse, jsonError } from "../../lib/response";

export class BoxAddTag extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Add a tag to a box",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							tagId: Str({ description: "Tag ID to add" }),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Tag added successfully",
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
		const { boxId } = data.params;
		const { tagId } = data.body;

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

		// Add tag to box
		const added = await boxEntity.addTag(boxId, tagId);

		if (!added) {
			return jsonError("Tag already added to this box", 409);
		}

		return successResponse({
			message: `Tag "${tag.name}" added to box`,
		});
	}
}
