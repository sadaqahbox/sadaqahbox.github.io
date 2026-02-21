import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { getCurrencyTypeEntity } from "../../entities/currency-type";
import { successResponse, jsonError } from "../../lib/response";

export class CurrencyTypeDelete extends OpenAPIRoute {
	schema = {
		tags: ["Currency Types"],
		summary: "Delete a currency type",
		request: {
			params: z.object({
				currencyTypeId: Str({ description: "Currency Type ID" }),
			}),
		},
		responses: {
			"200": {
				description: "Currency type deleted successfully",
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

		// Check if currency type exists
		const currencyType = await currencyTypeEntity.get(currencyTypeId);
		if (!currencyType) {
			return jsonError("Currency type not found", 404);
		}

		await currencyTypeEntity.delete(currencyTypeId);

		return successResponse({
			message: `Currency type "${currencyType.name}" deleted successfully`,
		});
	}
}
