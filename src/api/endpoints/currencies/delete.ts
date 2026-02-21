import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { getCurrencyEntity } from "../../entities/currency";
import { successResponse, jsonError } from "../../lib/response";

export class CurrencyDelete extends OpenAPIRoute {
	schema = {
		tags: ["Currencies"],
		summary: "Delete a currency",
		request: {
			params: z.object({
				currencyId: Str({ description: "Currency ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Currency deleted successfully",
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

		// Check if currency exists
		const currency = await currencyEntity.get(currencyId);
		if (!currency) {
			return jsonError("Currency not found", 404);
		}

		await currencyEntity.delete(currencyId);

		return successResponse({
			message: `Currency "${currency.code}" deleted successfully`,
		});
	}
}
