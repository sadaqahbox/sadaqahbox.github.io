import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { CurrencySchema } from "../../entities/types";
import { getCurrencyEntity } from "../../entities/currency";
import { successResponse, jsonError } from "../../lib/response";

export class CurrencyCreate extends OpenAPIRoute {
	schema = {
		tags: ["Currencies"],
		summary: "Create a new currency",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							code: Str({ example: "USD", description: "ISO 4217 currency code" }),
							name: Str({ example: "US Dollar", description: "Currency name" }),
							symbol: Str({ required: false, example: "$", description: "Currency symbol" }),
						}),
					},
				},
			},
		},
		responses: {
			"201": {
				description: "Returns the created currency",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							currency: CurrencySchema,
						}),
					},
				},
			},
			"409": {
				description: "Currency with this code already exists",
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
		const { code, name, symbol } = data.body;

		const currencyEntity = getCurrencyEntity(c);

		// Check if currency already exists
		const existing = await currencyEntity.getByCode(code);
		if (existing) {
			return jsonError("Currency with this code already exists", 409);
		}

		const currency = await currencyEntity.create({
			code,
			name,
			symbol,
		});

		c.status(201);
		return successResponse({ currency });
	}
}
