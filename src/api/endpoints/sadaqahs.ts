/**
 * Sadaqah endpoints
 */

import { Bool, Num, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { Context } from "hono";
import { SadaqahSchema, AddSadaqahBodySchema } from "../domain/schemas";
import { getSadaqahEntity, getBoxEntity, getCurrencyEntity } from "../entities";
import { success, notFound, validationError } from "../shared/response";
import { DEFAULT_SADAQAH_VALUE, DEFAULT_CURRENCY_CODE, MAX_SADAQAH_AMOUNT } from "../domain/constants";

// ============== List Sadaqahs ==============

export class SadaqahList extends OpenAPIRoute {
	schema = {
		tags: ["Sadaqahs"],
		summary: "List sadaqahs in a box",
		request: {
			params: z.object({ boxId: Str() }),
			query: z.object({
				page: z.coerce.number().int().positive().default(1),
				limit: z.coerce.number().int().positive().max(100).default(50),
				from: Str({ required: false }),
				to: Str({ required: false }),
			}),
		},
		responses: {
			"200": {
				description: "Returns sadaqahs",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							sadaqahs: SadaqahSchema.array(),
							total: Num(),
							summary: z.object({
								totalSadaqahs: Num(),
								totalValue: Num(),
								currency: z.any(),
							}),
						}),
					},
				},
			},
			"404": { description: "Box not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;
		const { page, limit, from, to } = data.query;

		// Verify box exists
		const box = await getBoxEntity(c).get(boxId);
		if (!box) {
			return notFound("Box", boxId);
		}

		const result = await getSadaqahEntity(c).list(boxId, { page, limit, from, to });
		return success({
			sadaqahs: result.sadaqahs,
			total: result.total,
			summary: result.summary,
		});
	}
}

// ============== Add Sadaqah ==============

export class SadaqahAdd extends OpenAPIRoute {
	schema = {
		tags: ["Sadaqahs"],
		summary: "Add sadaqah(s) to a box",
		request: {
			params: z.object({ boxId: Str() }),
			body: {
				content: {
					"application/json": { schema: AddSadaqahBodySchema },
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
			"400": { description: "Invalid input" },
			"404": { description: "Box not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId } = data.params;
		const { amount, value, currencyCode, metadata } = data.body;

		// Validate box exists
		const box = await getBoxEntity(c).get(boxId);
		if (!box) {
			return notFound("Box", boxId);
		}

		// Validate amount
		const sadaqahAmount = Math.min(Math.max(1, amount || 1), MAX_SADAQAH_AMOUNT);

		// Validate value
		const sadaqahValue = value !== undefined && value > 0 ? value : DEFAULT_SADAQAH_VALUE;

		// Get or create currency
		const currency = await getCurrencyEntity(c).getOrCreate({
			code: (currencyCode || DEFAULT_CURRENCY_CODE).toUpperCase(),
		});

		// Add sadaqahs
		const result = await getSadaqahEntity(c).addMultiple({
			boxId,
			amount: sadaqahAmount,
			value: sadaqahValue,
			currencyId: currency.id,
			metadata,
		});

		if (!result) {
			return validationError("Failed to add sadaqahs");
		}

		const sadaqahCount = result.sadaqahs.length;
		const sadaqahCurrencyCode = currencyCode || DEFAULT_CURRENCY_CODE;

		return success({
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

// ============== Get Sadaqah ==============

export class SadaqahGet extends OpenAPIRoute {
	schema = {
		tags: ["Sadaqahs"],
		summary: "Get a specific sadaqah",
		request: {
			params: z.object({
				boxId: Str(),
				sadaqahId: Str(),
			}),
		},
		responses: {
			"200": {
				description: "Returns the sadaqah",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), sadaqah: SadaqahSchema }),
					},
				},
			},
			"404": { description: "Sadaqah not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId, sadaqahId } = data.params;

		const sadaqah = await getSadaqahEntity(c).get(boxId, sadaqahId);

		if (!sadaqah) {
			return notFound("Sadaqah", sadaqahId);
		}

		return success({ sadaqah });
	}
}

// ============== Delete Sadaqah ==============

export class SadaqahDelete extends OpenAPIRoute {
	schema = {
		tags: ["Sadaqahs"],
		summary: "Delete a sadaqah",
		request: {
			params: z.object({
				boxId: Str(),
				sadaqahId: Str(),
			}),
		},
		responses: {
			"200": {
				description: "Sadaqah deleted",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), deleted: Bool() }),
					},
				},
			},
			"404": { description: "Sadaqah not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { boxId, sadaqahId } = data.params;

		const deleted = await getSadaqahEntity(c).delete(boxId, sadaqahId);

		if (!deleted) {
			return notFound("Sadaqah", sadaqahId);
		}

		return success({ deleted: true });
	}
}
