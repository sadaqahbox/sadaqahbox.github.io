/**
 * Currency endpoints
 */

import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { Context } from "hono";
import { CurrencySchema, CreateCurrencyBodySchema } from "../domain/schemas";
import { getCurrencyEntity } from "../entities";
import { success, notFound, conflict } from "../shared/response";

// ============== List Currencies ==============

export class CurrencyList extends OpenAPIRoute {
	schema = {
		tags: ["Currencies"],
		summary: "List all currencies",
		responses: {
			"200": {
				description: "Returns all currencies",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							currencies: CurrencySchema.array(),
						}),
					},
				},
			},
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const currencies = await getCurrencyEntity(c).list();
		return success({ currencies });
	}
}

// ============== Create Currency ==============

export class CurrencyCreate extends OpenAPIRoute {
	schema = {
		tags: ["Currencies"],
		summary: "Create a new currency",
		request: {
			body: {
				content: {
					"application/json": { schema: CreateCurrencyBodySchema },
				},
			},
		},
		responses: {
			"201": {
				description: "Returns the created currency",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), currency: CurrencySchema }),
					},
				},
			},
			"409": { description: "Currency already exists" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { code, name, symbol, currencyTypeId } = data.body;

		const currencyEntity = getCurrencyEntity(c);

		// Check if currency already exists
		const existing = await currencyEntity.getByCode(code);
		if (existing) {
			return conflict("Currency with this code already exists");
		}

		const currency = await currencyEntity.create({
			code,
			name,
			symbol,
			currencyTypeId,
		});

		c.status(201);
		return success({ currency });
	}
}

// ============== Get Currency ==============

export class CurrencyGet extends OpenAPIRoute {
	schema = {
		tags: ["Currencies"],
		summary: "Get a currency",
		request: {
			params: z.object({ currencyId: Str() }),
		},
		responses: {
			"200": {
				description: "Returns the currency",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), currency: CurrencySchema }),
					},
				},
			},
			"404": { description: "Currency not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { currencyId } = data.params;

		const currency = await getCurrencyEntity(c).get(currencyId);

		if (!currency) {
			return notFound("Currency", currencyId);
		}

		return success({ currency });
	}
}

// ============== Delete Currency ==============

export class CurrencyDelete extends OpenAPIRoute {
	schema = {
		tags: ["Currencies"],
		summary: "Delete a currency",
		request: {
			params: z.object({ currencyId: Str() }),
		},
		responses: {
			"200": {
				description: "Currency deleted",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), deleted: Bool() }),
					},
				},
			},
			"404": { description: "Currency not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { currencyId } = data.params;

		const deleted = await getCurrencyEntity(c).delete(currencyId);

		if (!deleted) {
			return notFound("Currency", currencyId);
		}

		return success({ deleted: true });
	}
}
