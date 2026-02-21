import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { CurrencyTypeSchema } from "../../entities/types";
import { getCurrencyTypeEntity } from "../../entities/currency-type";
import { successResponse, jsonError } from "../../lib/response";

export class CurrencyTypeGet extends OpenAPIRoute {
	schema = {
		tags: ["Currency Types"],
		summary: "Get a currency type by ID",
		request: {
			params: z.object({
				currencyTypeId: Str({ description: "Currency Type ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns the currency type",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							currencyType: CurrencyTypeSchema,
						}),
					},
				},
			},
			"404": {
				description: "Currency type not found",
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
		const { currencyTypeId } = data.params;

		const currencyTypeEntity = getCurrencyTypeEntity(c);
		const currencyType = await currencyTypeEntity.get(currencyTypeId);

		if (!currencyType) {
			return jsonError("Currency type not found", 404);
		}

		return successResponse({ currencyType });
	}
}
