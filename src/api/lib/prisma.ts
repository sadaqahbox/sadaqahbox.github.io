import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import type { Context } from "hono";

declare module "hono" {
	interface ContextVariableMap {
		prisma: PrismaClient;
	}
}

export type PrismaClientType = PrismaClient;

/**
 * Creates a new Prisma client instance with D1 adapter
 * Note: In most cases, use getPrismaFromContext instead to reuse instances
 */
export function createPrismaClient(d1Database: D1Database): PrismaClientType {
	const adapter = new PrismaD1(d1Database);
	return new PrismaClient({ adapter });
}

/**
 * Gets or creates a Prisma client from the Hono context
 * This ensures the same instance is reused within a request
 */
export function getPrismaFromContext(c: Context<{ Bindings: Env }>): PrismaClientType {
	let prisma = c.get('prisma');
	if (!prisma) {
		prisma = createPrismaClient(c.env.DB);
		c.set('prisma', prisma);
	}
	return prisma;
}
