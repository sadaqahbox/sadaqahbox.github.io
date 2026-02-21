import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { TagSchema } from "../../entities/types";
import { getTagEntity } from "../../entities/tag";
import { successResponse } from "../../lib/response";

export class TagList extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "List all tags",
		responses: {
			"200": {
				description: "Returns a list of tags",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							tags: TagSchema.array(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const tagEntity = getTagEntity(c);
		const tags = await tagEntity.list();

		return successResponse({ tags });
	}
}
