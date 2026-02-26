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
    
    // Merge better-auth response headers with any headers already set on the context (e.g., CORS)
    const headers = new Headers(res.headers);
    
    // Copy CORS headers from context if they were set by the CORS middleware
    const corsOrigin = c.res.headers.get("Access-Control-Allow-Origin");
    if (corsOrigin) {
        headers.set("Access-Control-Allow-Origin", corsOrigin);
    }
    const corsCredentials = c.res.headers.get("Access-Control-Allow-Credentials");
    if (corsCredentials) {
        headers.set("Access-Control-Allow-Credentials", corsCredentials);
    }
    const vary = c.res.headers.get("Vary");
    if (vary) {
        headers.set("Vary", vary);
    }
    
    // Use native Response constructor to properly pass status, statusText and headers
    return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
    });
}
