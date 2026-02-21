import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { CurrencySchema } from "../../entities/types";
import { getCurrencyEntity } from "../../entities/currency";
import { successResponse, jsonError } from "../../lib/response";

export class CurrencyGet extends OpenAPIRoute {
	schema = {
		tags: ["Currencies"],
		summary: "Get a currency by ID",
		request: {
			params: z.object({
				currencyId: Str({ description: "Currency ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns the currency",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							currency: CurrencySchema,
						}),
					},
				},
			},
			"404": {
				description: "Currency not found",
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
		const { currencyId } = data.params;

		const currencyEntity = getCurrencyEntity(c);
		const currency = await currencyEntity.get(currencyId);

		if (!currency) {
			return jsonError("Currency not found", 404);
		}

		return successResponse({ currency });
	}
}
