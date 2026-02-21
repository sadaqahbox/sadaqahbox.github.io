import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { SadaqahSchema } from "../../entities/types";
import { getSadaqahEntity } from "../../entities/sadaqah";
import { successResponse, jsonError } from "../../lib/response";

export class SadaqahGet extends OpenAPIRoute {
	schema = {
		tags: ["Sadaqahs"],
		summary: "Get a specific sadaqah",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
				sadaqahId: Str({ description: "Sadaqah ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns the sadaqah",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							sadaqah: SadaqahSchema,
						}),
					},
				},
			},
			"404": {
				description: "Sadaqah not found",
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

		const sadaqahEntity = getSadaqahEntity(c);
		const sadaqah = await sadaqahEntity.get(boxId, sadaqahId);

		if (!sadaqah) {
			return jsonError("Sadaqah not found", 404);
		}

		return successResponse({ sadaqah });
	}
}
