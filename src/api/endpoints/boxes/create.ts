import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { BoxSchema } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { getTagEntity } from "../../entities/tag";
import { successResponse, jsonError } from "../../lib/response";
import { BoxNameSchema, BoxDescriptionSchema } from "../../utils/validators";
import { MAX_BOX_NAME_LENGTH, MAX_BOX_DESCRIPTION_LENGTH } from "../../utils/constants";

export class BoxCreate extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Create a new charity box",
		description: "Create a new box to collect coins. Each coin added will have its own value and currency.",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: Str({ 
								example: "Ramadan Charity",
								description: `Box name (max ${MAX_BOX_NAME_LENGTH} characters)`,
							}),
							description: Str({ 
								required: false,
								description: `Optional description (max ${MAX_BOX_DESCRIPTION_LENGTH} characters)`,
							}),
							metadata: z.record(z.string()).optional().describe("Optional metadata key-value pairs"),
							tagIds: Str().array().optional().describe("Optional array of tag IDs to attach to this box"),
						}),
					},
				},
			},
		},
		responses: {
			"201": {
				description: "Returns the created box",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							box: BoxSchema,
						}),
					},
				},
			},
			"400": {
				description: "Invalid input",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							error: Str(),
							code: Str().optional(),
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
							code: Str().optional(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { name, description, metadata, tagIds } = data.body;

		// Validate and sanitize input
		const sanitizedName = name?.trim();
		if (!sanitizedName || sanitizedName.length === 0) {
			return jsonError("Box name is required", 400);
		}
		if (sanitizedName.length > MAX_BOX_NAME_LENGTH) {
			return jsonError(`Box name must be less than ${MAX_BOX_NAME_LENGTH} characters`, 400);
		}

		if (description && description.length > MAX_BOX_DESCRIPTION_LENGTH) {
			return jsonError(`Description must be less than ${MAX_BOX_DESCRIPTION_LENGTH} characters`, 400);
		}

		// Validate tags if provided
		if (tagIds && tagIds.length > 0) {
			const tagEntity = getTagEntity(c);
			for (const tagId of tagIds) {
				const tag = await tagEntity.get(tagId);
				if (!tag) {
					return jsonError(`Tag "${tagId}" not found`, 404);
				}
			}
		}

		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.create({
			name: sanitizedName,
			description: description?.trim(),
			metadata,
			tagIds,
		});

		c.status(201);
		return successResponse({ box });
	}
}
