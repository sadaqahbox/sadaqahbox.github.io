/**
 * Auth Route Handler
 *
 * Handles all authentication routes by delegating to better-auth.
 */

import type { Context } from "hono";
import type { IncomingRequestCfProperties } from "@cloudflare/workers-types";
import { createAuth } from "../../auth";

/**
 * Handles auth routes by creating a better-auth instance and delegating the request
 */
export async function handleAuthRoute(c: Context<{ Bindings: Env }>): Promise<Response> {
    const cf = (c.req.raw as { cf?: IncomingRequestCfProperties }).cf;
    const auth = createAuth(
        c.env as unknown as Parameters<typeof createAuth>[0],
        cf
    );
    const res = await auth.handler(c.req.raw);
    return c.newResponse(res.body, res);
}
