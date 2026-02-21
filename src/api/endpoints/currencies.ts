/**
 * Currency endpoints
 */

import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { CurrencySchema, CreateCurrencyBodySchema, createItemResponseSchema } from "../domain/schemas";
import { getCurrencyEntity } from "../entities";
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

// ============== List Currencies ==============

const ListResponseSchema = createPaginatedResponse(CurrencySchema, "currencies");

export const listRoute = buildRoute({
	method: "get",
	path: "/api/currencies",
	tags: ["Currencies"],
	summary: "List all currencies",
	responses: create200Response(ListResponseSchema, "Returns all currencies"),
});

export const listHandler = async (c: Context<{ Bindings: Env }>) => {
	const currencies = await getCurrencyEntity(c).list();
	return c.json(success({ currencies, total: currencies.length }));
};

// ============== Create Currency ==============

const CreateResponseSchema = createItemResponseSchema(CurrencySchema, "currency");

export const createRoute = buildRoute({
	method: "post",
	path: "/api/currencies",
	tags: ["Currencies"],
	summary: "Create a new currency",
	body: CreateCurrencyBodySchema,
	responses: {
		...create201Response(CreateResponseSchema, "Returns the created currency"),
		...create409Response("Currency already exists"),
	},
	requireAuth: true,
});

export const createHandler = async (c: Context<{ Bindings: Env }>) => {
	const { code, name, symbol, currencyTypeId } = getBody<{
		code: string;
		name: string;
		symbol?: string;
		currencyTypeId?: string;
	}>(c);

	const currencyEntity = getCurrencyEntity(c);

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

	return jsonSuccess(c, { currency }, 201);
};

// ============== Get Currency ==============

const CurrencyIdParamSchema = createIdParamSchema("currencyId");

const GetResponseSchema = createItemResponseSchema(CurrencySchema, "currency");

export const getRoute = buildRoute({
	method: "get",
	path: "/api/currencies/{currencyId}",
	tags: ["Currencies"],
	summary: "Get a currency",
	params: CurrencyIdParamSchema,
	responses: {
		...create200Response(GetResponseSchema, "Returns the currency"),
		...create404Response("Currency not found"),
	},
});

export const getHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyId } = getParams<{ currencyId: string }>(c);

	const currency = await getCurrencyEntity(c).get(currencyId);
	if (!currency) {
		return notFound("Currency", currencyId);
	}

	return c.json(success({ currency }));
};

// ============== Delete Currency ==============

const DeleteResponseSchema = createItemResponseSchema(z.object({ deleted: z.boolean() }), "data");

export const deleteRoute = buildRoute({
	method: "delete",
	path: "/api/currencies/{currencyId}",
	tags: ["Currencies"],
	summary: "Delete a currency",
	params: CurrencyIdParamSchema,
	responses: {
		...create200Response(DeleteResponseSchema, "Currency deleted"),
		...create404Response("Currency not found"),
	},
	requireAuth: true,
});

export const deleteHandler = async (c: Context<{ Bindings: Env }>) => {
	const { currencyId } = getParams<{ currencyId: string }>(c);

	const deleted = await getCurrencyEntity(c).delete(currencyId);
	if (!deleted) {
		return notFound("Currency", currencyId);
	}

	return c.json(success({ deleted: true }));
};
