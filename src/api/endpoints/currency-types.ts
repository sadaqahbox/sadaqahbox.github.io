/**
 * Currency Type endpoints
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { CurrencyTypeSchema, CreateCurrencyTypeBodySchema, createItemResponseSchema } from "../domain/schemas";
import { getCurrencyTypeEntity } from "../entities";
import { success, notFound, conflict } from "../shared/response";
import {
	buildRoute,
	getParams,
	getBody,
	jsonSuccess,
	createIdParamSchema,
	createPaginatedResponse,
	create200Response,
	create201Response,
	create404Response,
	create409Response,
} from "../shared/route-builder";

// ============== List Currency Types ==============

const ListResponseSchema = createPaginatedResponse(CurrencyTypeSchema, "currencyTypes");

export const listRoute = buildRoute({
	method: "get",
	path: "/api/currency-types",
	tags: ["Currency Types"],
	summary: "List all currency types",
	responses: create200Response(ListResponseSchema, "Returns all currency types"),
});

export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const currencyTypes = await getCurrencyTypeEntity(c).list();
	return c.json(success({ currencyTypes, total: currencyTypes.length }));
};

// ============== Create Currency Type ==============

const CreateResponseSchema = createItemResponseSchema(CurrencyTypeSchema, "currencyType");

export const createRoute = buildRoute({
	method: "post",
	path: "/api/currency-types",
	tags: ["Currency Types"],
	summary: "Create a new currency type",
	body: CreateCurrencyTypeBodySchema,
	responses: {
		...create201Response(CreateResponseSchema, "Returns the created currency type"),
		...create409Response("Currency type already exists"),
	},
});

export const createHandler = async (c: Context<{ Bindings: Env }>) => {
	const { name, description } = getBody<{
		name: string;
		description?: string;
	}>(c);

	const currencyTypeEntity = getCurrencyTypeEntity(c);

	const existing = await currencyTypeEntity.getByName(name);
	if (existing) {
		return conflict("Currency type with this name already exists");
	}

	const currencyType = await currencyTypeEntity.create({ name, description });
	return jsonSuccess(c, { currencyType }, 201);
};

// ============== Get Currency Type ==============

const CurrencyTypeIdParamSchema = createIdParamSchema("currencyTypeId");

const GetResponseSchema = createItemResponseSchema(CurrencyTypeSchema, "currencyType");

export const getRoute = buildRoute({
	method: "get",
	path: "/api/currency-types/{currencyTypeId}",
	tags: ["Currency Types"],
	summary: "Get a currency type",
	params: CurrencyTypeIdParamSchema,
	responses: {
		...create200Response(GetResponseSchema, "Returns the currency type"),
		...create404Response("Currency type not found"),
	},
});

export const getHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyTypeId } = getParams<{ currencyTypeId: string }>(c);

	const currencyType = await getCurrencyTypeEntity(c).get(currencyTypeId);
	if (!currencyType) {
		return notFound("Currency type", currencyTypeId);
	}

	return c.json(success({ currencyType }));
};

// ============== Delete Currency Type ==============

const DeleteResponseSchema = createItemResponseSchema(z.object({ deleted: z.boolean() }), "data");

export const deleteRoute = buildRoute({
	method: "delete",
	path: "/api/currency-types/{currencyTypeId}",
	tags: ["Currency Types"],
	summary: "Delete a currency type",
	params: CurrencyTypeIdParamSchema,
	responses: {
		...create200Response(DeleteResponseSchema, "Currency type deleted"),
		...create404Response("Currency type not found"),
	},
});

export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyTypeId } = getParams<{ currencyTypeId: string }>(c);

	const deleted = await getCurrencyTypeEntity(c).delete(currencyTypeId);
	if (!deleted) {
		return notFound("Currency type", currencyTypeId);
	}

	return c.json(success({ deleted: true }));
};

// ============== Initialize Default Currency Types ==============

const InitializeResponseSchema = z.object({
	success: z.boolean(),
	currencyTypes: CurrencyTypeSchema.array(),
	message: z.string(),
});

export const initializeRoute = buildRoute({
	method: "post",
	path: "/api/currency-types/initialize",
	tags: ["Currency Types"],
	summary: "Initialize default currency types (Fiat, Crypto, Commodity)",
	responses: create200Response(InitializeResponseSchema, "Default currency types initialized"),
});

export const initializeHandler = async (c: Context<{ Bindings: Env }>) => {
	const currencyTypes = await getCurrencyTypeEntity(c).initializeDefaults();
	return c.json(success({
		currencyTypes,
		message: "Default currency types initialized successfully",
	}));
};
