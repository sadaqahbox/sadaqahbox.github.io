import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { BoxSchema } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { successResponse, jsonError } from "../../lib/response";
import { MAX_BOX_NAME_LENGTH, MAX_BOX_DESCRIPTION_LENGTH } from "../../utils/constants";

export class BoxUpdate extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Update a charity box",
		description: "Partially update a box's name, description, or metadata. Only provided fields will be updated.",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: Str({
								required: false,
								example: "Updated Box Name",
								description: `New box name (max ${MAX_BOX_NAME_LENGTH} characters)`,
							}),
							description: Str({
								required: false,
								description: `New description (max ${MAX_BOX_DESCRIPTION_LENGTH} characters)`,
							}),
							metadata: z.record(z.string()).optional().describe("Metadata key-value pairs to set (replaces existing)"),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the updated box",
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
		const { name, description, metadata } = data.body;

		// Validate box exists
		const boxEntity = getBoxEntity(c);
		const existingBox = await boxEntity.get(boxId);
		if (!existingBox) {
			return jsonError("Box not found", 404);
		}

		// Validate name if provided
		if (name !== undefined) {
			const trimmedName = name?.trim();
			if (!trimmedName || trimmedName.length === 0) {
				return jsonError("Box name cannot be empty", 400);
			}
			if (trimmedName.length > MAX_BOX_NAME_LENGTH) {
				return jsonError(`Box name must be less than ${MAX_BOX_NAME_LENGTH} characters`, 400);
			}
		}

		// Validate description if provided
		if (description !== undefined && description.length > MAX_BOX_DESCRIPTION_LENGTH) {
			return jsonError(`Description must be less than ${MAX_BOX_DESCRIPTION_LENGTH} characters`, 400);
		}

		// Build updates object with only provided fields
		const updates: Partial<typeof data.body> = {};
		if (name !== undefined) updates.name = name.trim();
		if (description !== undefined) updates.description = description.trim();
		if (metadata !== undefined) updates.metadata = metadata;

		// Update the box
		const box = await boxEntity.update(boxId, updates);

		if (!box) {
			return jsonError("Failed to update box", 500);
		}

		return successResponse({ box });
	}
}
