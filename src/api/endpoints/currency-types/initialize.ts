import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { CurrencyTypeSchema } from "../../entities/types";
import { getCurrencyTypeEntity } from "../../entities/currency-type";
import { successResponse } from "../../lib/response";

export class CurrencyTypeInitialize extends OpenAPIRoute {
	schema = {
		tags: ["Currency Types"],
		summary: "Initialize default currency types (Fiat, Crypto, Commodity)",
		responses: {
			"200": {
				description: "Returns the initialized default currency types",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							message: Str(),
							currencyTypes: CurrencyTypeSchema.array(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const currencyTypeEntity = getCurrencyTypeEntity(c);
		const currencyTypes = await currencyTypeEntity.initializeDefaults();

		return successResponse({
			message: "Default currency types initialized successfully",
			currencyTypes,
		});
	}
}
