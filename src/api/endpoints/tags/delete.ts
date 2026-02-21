import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { getTagEntity } from "../../entities/tag";
import { successResponse, jsonError } from "../../lib/response";

export class TagDelete extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "Delete a tag",
		request: {
			params: z.object({
				tagId: Str({ description: "Tag ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Tag deleted successfully",
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
				description: "Tag not found",
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
		const { tagId } = data.params;

		const tagEntity = getTagEntity(c);

		// Check if tag exists
		const tag = await tagEntity.get(tagId);
		if (!tag) {
			return jsonError("Tag not found", 404);
		}

		await tagEntity.delete(tagId);

		return successResponse({
			message: `Tag "${tag.name}" deleted successfully`,
		});
	}
}
