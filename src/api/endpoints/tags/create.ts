import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { TagSchema } from "../../entities/types";
import { getTagEntity } from "../../entities/tag";
import { successResponse, jsonError } from "../../lib/response";

export class TagCreate extends OpenAPIRoute {
	schema = {
		tags: ["Tags"],
		summary: "Create a new tag",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: Str({ example: "Ramadan", description: "Tag name" }),
							color: Str({ required: false, example: "#FF6B6B", description: "Tag color hex code" }),
						}),
					},
				},
			},
		},
		responses: {
			"201": {
				description: "Returns the created tag",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							tag: TagSchema,
						}),
					},
				},
			},
			"409": {
				description: "Tag with this name already exists",
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
		const { name, color } = data.body;

		const tagEntity = getTagEntity(c);

		// Check if tag already exists
		const existing = await tagEntity.getByName(name);
		if (existing) {
			return jsonError("Tag with this name already exists", 409);
		}

		const tag = await tagEntity.create({
			name,
			color,
		});

		c.status(201);
		return successResponse({ tag });
	}
}
