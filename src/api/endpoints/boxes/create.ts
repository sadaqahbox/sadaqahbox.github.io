import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { BoxSchema } from "../../entities/types";
import { getBoxEntity } from "../../entities/box";
import { successResponse } from "../../lib/response";

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
							name: Str({ example: "Ramadan Charity" }),
							description: Str({ required: false }),
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
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { name, description } = data.body;

		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.create({
			name,
			description,
		});

		c.status(201);
		return successResponse({ box });
	}
}
