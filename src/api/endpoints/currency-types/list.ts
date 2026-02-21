import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { CurrencyTypeSchema } from "../../entities/types";
import { getCurrencyTypeEntity } from "../../entities/currency-type";
import { successResponse } from "../../lib/response";

export class CurrencyTypeList extends OpenAPIRoute {
	schema = {
		tags: ["Currency Types"],
		summary: "List all currency types",
		responses: {
			"200": {
				description: "Returns a list of currency types",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							currencyTypes: CurrencyTypeSchema.array(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const currencyTypeEntity = getCurrencyTypeEntity(c);
		const currencyTypes = await currencyTypeEntity.list();

		return successResponse({ currencyTypes });
	}
}
