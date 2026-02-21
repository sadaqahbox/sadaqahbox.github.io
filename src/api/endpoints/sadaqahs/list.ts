import { Bool, DateTime, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { SadaqahSchema } from "../../entities/types";
import { getSadaqahEntity } from "../../entities/sadaqah";
import { successResponse, createPagination } from "../../lib/response";

export class SadaqahList extends OpenAPIRoute {
	schema = {
		tags: ["Sadaqahs"],
		summary: "List sadaqahs in a box",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
			}),
			query: z.object({
				page: Num({ default: 1 }),
				limit: Num({ default: 50 }),
				from: DateTime({ required: false }),
				to: DateTime({ required: false }),
			}),
		},
		responses: {
			"200": {
				description: "Returns paginated sadaqahs",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							boxId: Str(),
							sadaqahs: SadaqahSchema.array(),
							pagination: z.object({
								page: Num(),
								limit: Num(),
								total: Num(),
								totalPages: Num(),
							}),
							summary: z.object({
								totalSadaqahs: Num(),
								totalValue: Num(),
								currency: Str(),
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
		const { page, limit, from, to } = data.query;

		const sadaqahEntity = getSadaqahEntity(c);
		const result = await sadaqahEntity.list(boxId, { page, limit, from, to });

		return successResponse({
			boxId,
			sadaqahs: result.sadaqahs,
			pagination: createPagination(page, limit, result.total),
			summary: result.summary,
		});
	}
}
