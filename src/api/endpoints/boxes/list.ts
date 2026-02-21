import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { BoxSchema } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { successResponse } from "../../lib/response";

export class BoxList extends OpenAPIRoute {
	schema = {
		tags: ["Boxes"],
		summary: "List all charity boxes",
		request: {
			query: z.object({
				sortBy: z.enum(["name", "createdAt", "count", "totalValue"]).default("createdAt"),
				sortOrder: z.enum(["asc", "desc"]).default("desc"),
			}),
		},
		responses: {
			"200": {
				description: "Returns a list of boxes",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							boxes: BoxSchema.array(),
							summary: z.object({
								totalBoxes: Num(),
								totalCoins: Num(),
								totalValue: Num(),
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { sortBy, sortOrder } = data.query;

		const boxEntity = getBoxEntity(c);
		let boxes = await boxEntity.list();

		// Sort
		boxes.sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "count":
					comparison = a.count - b.count;
					break;
				case "totalValue":
					comparison = a.totalValue - b.totalValue;
					break;
				case "createdAt":
				default:
					comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			}
			return sortOrder === "desc" ? -comparison : comparison;
		});

		// Summary
		const totalCoins = boxes.reduce((sum, b) => sum + b.count, 0);
		const totalValue = boxes.reduce((sum, b) => sum + b.totalValue, 0);

		return successResponse({
			boxes,
			summary: {
				totalBoxes: boxes.length,
				totalCoins,
				totalValue,
			},
		});
	}
}
