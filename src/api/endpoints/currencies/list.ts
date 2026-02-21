import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { CurrencySchema } from "../../entities/types";
import { getCurrencyEntity } from "../../entities/currency";
import { successResponse } from "../../lib/response";

export class CurrencyList extends OpenAPIRoute {
	schema = {
		tags: ["Currencies"],
		summary: "List all currencies",
		responses: {
			"200": {
				description: "Returns a list of currencies",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							currencies: CurrencySchema.array(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const currencyEntity = getCurrencyEntity(c);
		const currencies = await currencyEntity.list();

		return successResponse({ currencies });
	}
}
