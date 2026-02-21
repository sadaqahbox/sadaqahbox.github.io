import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { BoxSchema } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { successResponse, jsonError } from "../../lib/response";

export class BoxDelete extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "Delete a box and all its data",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns deletion summary",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							message: Str(),
							deleted: z.object({
								box: BoxSchema,
								sadaqahsDeleted: Num(),
								collectionsDeleted: Num(),
							}),
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

		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.get(boxId);

		if (!box) {
			return jsonError("Box not found", 404);
		}

		const result = await boxEntity.delete(boxId);

		return successResponse({
			message: `Box "${box.name}" and all associated data have been permanently deleted`,
			deleted: {
				box,
				sadaqahsDeleted: result.sadaqahsDeleted,
				collectionsDeleted: result.collectionsDeleted,
			},
		});
	}
}
