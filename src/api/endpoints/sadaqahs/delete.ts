import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { getSadaqahEntity } from "../../entities/sadaqah";
import { getBoxEntity } from "../../entities/box";
import { successResponse, jsonError } from "../../lib/response";

export class SadaqahDelete extends OpenAPIRoute {
	schema = {
		tags: ["Sadaqahs"],
		summary: "Delete a sadaqah",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
				sadaqahId: Str({ description: "Sadaqah ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Sadaqah deleted successfully",
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
				description: "Box or sadaqah not found",
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
		const { boxId, sadaqahId } = data.params;

		// Verify box exists
		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.get(boxId);
		if (!box) {
			return jsonError("Box not found", 404);
		}

		// Delete sadaqah
		const sadaqahEntity = getSadaqahEntity(c);
		const deleted = await sadaqahEntity.delete(boxId, sadaqahId);

		if (!deleted) {
			return jsonError("Failed to delete sadaqah", 500);
		}

		return successResponse({
			message: "Sadaqah deleted successfully",
		});
	}
}
