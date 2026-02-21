/**
 * Currency Type endpoints
 */

import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import type { Context } from "hono";
import { CurrencyTypeSchema, CreateCurrencyTypeBodySchema } from "../domain/schemas";
import { getCurrencyTypeEntity } from "../entities";
import { success, notFound, conflict } from "../shared/response";

// ============== List Currency Types ==============

export class CurrencyTypeList extends OpenAPIRoute {
	schema = {
		tags: ["Currency Types"],
		summary: "List all currency types",
		responses: {
			"200": {
				description: "Returns all currency types",
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

	async handle(c: Context<{ Bindings: Env }>) {
		const currencyTypes = await getCurrencyTypeEntity(c).list();
		return success({ currencyTypes });
	}
}

// ============== Create Currency Type ==============

export class CurrencyTypeCreate extends OpenAPIRoute {
	schema = {
		tags: ["Currency Types"],
		summary: "Create a new currency type",
		request: {
			body: {
				content: {
					"application/json": { schema: CreateCurrencyTypeBodySchema },
				},
			},
		},
		responses: {
			"201": {
				description: "Returns the created currency type",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), currencyType: CurrencyTypeSchema }),
					},
				},
			},
			"409": { description: "Currency type already exists" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { name, description } = data.body;

		const currencyTypeEntity = getCurrencyTypeEntity(c);

		// Check if already exists
		const existing = await currencyTypeEntity.getByName(name);
		if (existing) {
			return conflict("Currency type with this name already exists");
		}

		const currencyType = await currencyTypeEntity.create({ name, description });

		c.status(201);
		return success({ currencyType });
	}
}

// ============== Get Currency Type ==============

export class CurrencyTypeGet extends OpenAPIRoute {
	schema = {
		tags: ["Currency Types"],
		summary: "Get a currency type",
		request: {
			params: z.object({ currencyTypeId: Str() }),
		},
		responses: {
			"200": {
				description: "Returns the currency type",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), currencyType: CurrencyTypeSchema }),
					},
				},
			},
			"404": { description: "Currency type not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { currencyTypeId } = data.params;

		const currencyType = await getCurrencyTypeEntity(c).get(currencyTypeId);

		if (!currencyType) {
			return notFound("Currency type", currencyTypeId);
		}

		return success({ currencyType });
	}
}

// ============== Delete Currency Type ==============

export class CurrencyTypeDelete extends OpenAPIRoute {
	schema = {
		tags: ["Currency Types"],
		summary: "Delete a currency type",
		request: {
			params: z.object({ currencyTypeId: Str() }),
		},
		responses: {
			"200": {
				description: "Currency type deleted",
				content: {
					"application/json": {
						schema: z.object({ success: Bool(), deleted: Bool() }),
					},
				},
			},
			"404": { description: "Currency type not found" },
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { currencyTypeId } = data.params;

		const deleted = await getCurrencyTypeEntity(c).delete(currencyTypeId);

		if (!deleted) {
			return notFound("Currency type", currencyTypeId);
		}

		return success({ deleted: true });
	}
}

// ============== Initialize Default Currency Types ==============

export class CurrencyTypeInitialize extends OpenAPIRoute {
	schema = {
		tags: ["Currency Types"],
		summary: "Initialize default currency types (Fiat, Crypto, Commodity)",
		responses: {
			"200": {
				description: "Default currency types initialized",
				content: {
					"application/json": {
						schema: z.object({
							success: Bool(),
							currencyTypes: CurrencyTypeSchema.array(),
							message: Str(),
						}),
					},
				},
			},
		},
	};

	async handle(c: Context<{ Bindings: Env }>) {
		const currencyTypes = await getCurrencyTypeEntity(c).initializeDefaults();
		return success({
			currencyTypes,
			message: "Default currency types initialized successfully",
		});
	}
}
