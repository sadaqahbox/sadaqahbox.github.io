import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { CurrencyTypeSchema } from "../../entities/types";
import { getCurrencyTypeEntity } from "../../entities/currency-type";
import { successResponse, jsonError } from "../../lib/response";

export class CurrencyTypeCreate extends OpenAPIRoute {
	schema = {
		tags: ["Currency Types"],
		summary: "Create a new currency type",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							name: Str({ example: "Fiat", description: "Currency type name (e.g., Fiat, Crypto, Commodity)" }),
							description: Str({ required: false, example: "Government-issued currency", description: "Description of the currency type" }),
						}),
					},
				},
			},
		},
		responses: {
			"201": {
				description: "Returns the created currency type",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							currencyType: CurrencyTypeSchema,
						}),
					},
				},
			},
			"409": {
				description: "Currency type with this name already exists",
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
		const { name, description } = data.body;

		const currencyTypeEntity = getCurrencyTypeEntity(c);

		// Check if currency type already exists
		const existing = await currencyTypeEntity.getByName(name);
		if (existing) {
			return jsonError("Currency type with this name already exists", 409);
		}

		const currencyType = await currencyTypeEntity.create({
			name,
			description,
		});

		c.status(201);
		return successResponse({ currencyType });
	}
}
