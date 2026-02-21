import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../../entities/types";
import { SadaqahSchema } from "../../entities/types";
import { getSadaqahEntity } from "../../entities/sadaqah";
import { getBoxEntity } from "../../entities/box";
import { successResponse, jsonError } from "../../lib/response";

const DEFAULT_CURRENCY = "USD";
const DEFAULT_VALUE = 1;
const USER_AGENT_MAX_LENGTH = 200;

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
							amount: Num({ default: 1, description: "Number of sadaqahs to add" }),
							value: Num({ example: 1, description: "Value per sadaqah" }),
							currency: Str({ default: "USD", description: "Currency code (USD, EUR, TRY, etc.)" }),
							location: Str({ required: false, description: "Location where sadaqah was added" }),
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
								currency: Str().nullable(),
							}),
							message: Str(),
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

	private getRequestInfo(c: AppContext) {
		return {
			ipAddress: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown",
			userAgent: (c.req.header("user-agent") || "unknown").slice(0, USER_AGENT_MAX_LENGTH),
			country: c.req.header("cf-ipcountry") || "unknown",
		};
	}

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;
		const { amount, value, currency, location, metadata } = data.body;

		// Verify box exists
		const boxEntity = getBoxEntity(c);
		const box = await boxEntity.get(boxId);
		if (!box) {
			return jsonError("Box not found", 404);
		}

		// Get request info for tracking
		const { ipAddress, userAgent, country } = this.getRequestInfo(c);

		// Add sadaqahs
		const sadaqahEntity = getSadaqahEntity(c);
		const result = await sadaqahEntity.addMultiple({
			boxId,
			amount: amount || 1,
			value: value ?? DEFAULT_VALUE,
			currency: currency ?? DEFAULT_CURRENCY,
			location: location || country,
			ipAddress,
			userAgent,
			metadata,
		});

		if (!result) {
			return jsonError("Failed to add sadaqahs", 500);
		}

		const sadaqahCount = result.sadaqahs.length;
		const sadaqahValue = value ?? DEFAULT_VALUE;
		const sadaqahCurrency = currency ?? DEFAULT_CURRENCY;

		return successResponse({
			sadaqahs: result.sadaqahs,
			box: {
				id: result.box.id,
				name: result.box.name,
				count: result.box.count,
				totalValue: result.box.totalValue,
				currency: result.box.currency,
			},
			message: `Added ${sadaqahCount} sadaqah${sadaqahCount > 1 ? "s" : ""} (${sadaqahValue} ${sadaqahCurrency}) to "${box.name}"`,
		});
	}
}
