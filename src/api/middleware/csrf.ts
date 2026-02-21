/**
 * CSRF Protection Middleware
 *
 * Implements Double Submit Cookie pattern for CSRF protection.
 * The CSRF token is generated on the server and must be included in
 * state-changing requests via the X-CSRF-Token header.
 */

import type { Context, Next } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

export interface CSRFConfig {
    /** Cookie name for CSRF token (default: 'csrf_token') */
    cookieName?: string;
    /** Header name for CSRF token (default: 'X-CSRF-Token') */
    headerName?: string;
    /** Cookie options */
    cookieOptions?: {
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: "strict" | "lax" | "none";
        path?: string;
        maxAge?: number;
    };
    /** Routes that skip CSRF protection */
    exemptRoutes?: string[];
    /** Methods that require CSRF protection */
    protectedMethods?: string[];
}

const DEFAULT_CONFIG: Required<CSRFConfig> = {
    cookieName: "csrf_token",
    headerName: "X-CSRF-Token",
    cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 86400, // 24 hours
    },
    exemptRoutes: ["/api/auth/", "/api/health", "/api/webhooks/"],
    protectedMethods: ["POST", "PUT", "PATCH", "DELETE"],
};

/**
 * Generate a CSRF token using crypto
 */
function generateToken(): string {
    // Use Web Crypto API for token generation
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
}

/**
 * Check if route is exempt from CSRF protection
 */
function isExemptRoute(path: string, exemptRoutes: string[]): boolean {
    return exemptRoutes.some((route) => path.startsWith(route));
}

/**
 * CSRF protection middleware factory
 */
export function csrfProtection(config: CSRFConfig = {}) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    return async function csrfMiddleware(c: Context, next: Next) {
        const path = c.req.path;
        const method = c.req.method;

        // Skip for exempt routes
        if (isExemptRoute(path, fullConfig.exemptRoutes)) {
            return next();
        }

        // Get or create CSRF token cookie
        let csrfCookie = getCookie(c, fullConfig.cookieName);

        // For GET/HEAD requests, just ensure cookie exists
        if (!fullConfig.protectedMethods.includes(method)) {
            if (!csrfCookie) {
                csrfCookie = generateToken();
                setCookie(c, fullConfig.cookieName, csrfCookie, fullConfig.cookieOptions);
            }
            return next();
        }

        // For protected methods, verify CSRF token
        if (!csrfCookie) {
            return c.json(
                {
                    success: false,
                    error: "CSRF token missing",
                },
                403
            );
        }

        // Get token from header
        const csrfHeader = c.req.header(fullConfig.headerName);

        if (!csrfHeader) {
            return c.json(
                {
                    success: false,
                    error: `CSRF token required in ${fullConfig.headerName} header`,
                },
                403
            );
        }

        // Verify both tokens match
        if (csrfCookie !== csrfHeader) {
            // Clear invalid cookie
            deleteCookie(c, fullConfig.cookieName);

            return c.json(
                {
                    success: false,
                    error: "Invalid CSRF token",
                },
                403
            );
        }

        return next();
    };
}

/**
 * Generate a new CSRF token (useful for initial page load)
 */
export function generateCSRFToken(): string {
    return generateToken();
}

/**
 * Get CSRF token from cookie (for server-side rendering)
 */
export function getCSRFTokenFromCookie(c: Context, cookieName = "csrf_token"): string | undefined {
    return getCookie(c, cookieName);
}
