import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { TagSchema } from "../../entities/types";
import { getTagEntity } from "../../entities/tag";
import { successResponse, jsonError } from "../../lib/response";

export class TagGet extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "Get a tag by ID",
		request: {
			params: z.object({
				tagId: Str({ description: "Tag ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns the tag",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							tag: TagSchema,
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
		const tag = await tagEntity.get(tagId);

		if (!tag) {
			return jsonError("Tag not found", 404);
		}

		return successResponse({ tag });
	}
}
