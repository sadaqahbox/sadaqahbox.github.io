import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { SadaqahSchema } from "../../entities/types";
import { getSadaqahEntity } from "../../entities/sadaqah";
import { getBoxEntity } from "../../entities/box";
import { getCurrencyEntity } from "../../entities/currency";
import { successResponse, jsonError } from "../../lib/response";
import { CurrencyCodeSchema } from "../../utils/validators";
import { DEFAULT_SADAQAH_VALUE, DEFAULT_CURRENCY_CODE, MAX_SADAQAH_AMOUNT } from "../../utils/constants";

export class SadaqahAdd extends OpenAPIRoute {
	schema = {
		tags: ["Sadaqahs"],
		summary: "Add sadaqah(s) to a box",
		description: "Each sadaqah is an independent entity with its own value and currency. Value and currency must be specified.",
		request: {
			params: z.object({
				boxId: Str({ description: "Box ID" }),
			}),
			body: {
				content: {
					"application/json": {
						schema: z.object({
							amount: Num({ 
								default: 1, 
								description: `Number of sadaqahs to add (max ${MAX_SADAQAH_AMOUNT})`,
							}).optional(),
							value: Num({ 
								example: 1, 
								description: "Value per sadaqah (must be positive)",
							}).optional(),
							currencyCode: Str({ 
								default: DEFAULT_CURRENCY_CODE, 
								description: "Currency code (USD, EUR, TRY, etc.)" 
							}).optional(),
							metadata: z.record(z.string()).optional(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns created sadaqahs and updated box",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							sadaqahs: SadaqahSchema.array(),
							box: z.object({
								id: Str(),
								name: Str(),
								count: Num(),
								totalValue: Num(),
								currency: z.any().nullable(),
							}),
							message: Str(),
						}),
					},
				},
			},
			"400": {
				description: "Invalid input",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							error: Str(),
						}),
					},
				},
			},
			"404": {
				description: "Box not found",
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
		const { boxId } = data.params;
		const { amount, value, currencyCode, metadata } = data.body;

		// Validate box exists
		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.get(boxId);
		if (!box) {
			return jsonError("Box not found", 404);
		}

		// Validate amount
		const sadaqahAmount = Math.min(
			Math.max(1, amount || 1),
			MAX_SADAQAH_AMOUNT
		);

		// Validate value
		const sadaqahValue = value !== undefined && value > 0 ? value : DEFAULT_SADAQAH_VALUE;

		// Get or create currency
		const currencyEntity = getCurrencyEntity(c);
		const currency = await currencyEntity.getOrCreate({
			code: (currencyCode || DEFAULT_CURRENCY_CODE).toUpperCase(),
		});

		// Add sadaqahs
		const sadaqahEntity = getSadaqahEntity(c);
		const result = await sadaqahEntity.addMultiple({
			boxId,
			amount: sadaqahAmount,
			value: sadaqahValue,
			currencyId: currency.id,
			metadata,
		});

		if (!result) {
			return jsonError("Failed to add sadaqahs", 500);
		}

		const sadaqahCount = result.sadaqahs.length;
		const sadaqahCurrencyCode = currencyCode || DEFAULT_CURRENCY_CODE;

		return successResponse({
			sadaqahs: result.sadaqahs,
			box: {
				id: result.box.id,
				name: result.box.name,
				count: result.box.count,
				totalValue: result.box.totalValue,
				currency,
			},
			message: `Added ${sadaqahCount} sadaqah${sadaqahCount > 1 ? "s" : ""} (${sadaqahValue} ${sadaqahCurrencyCode}) to "${box.name}"`,
		});
	}
}
