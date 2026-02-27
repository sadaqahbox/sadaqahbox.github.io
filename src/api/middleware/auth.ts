/**
 * Authentication middleware
 *
 * Uses better-auth's built-in session verification for secure authentication.
 * Supports both session cookies and API key authentication (via enableSessionForAPIKeys).
 */

import type { Context, Next } from "hono";
import { createAuth } from "../../auth";
import { getDbFromContext } from "../../db";

// Extend Hono context to include user
declare module "hono" {
  interface ContextVariableMap {
    user: {
      id: string;
      email: string;
      name: string;
      role?: string | null;
    };
  }
}

/**
 * Middleware to require authentication
 * Supports both session cookies and API key authentication
 * Uses better-auth's enableSessionForAPIKeys feature for seamless API key handling
 */
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = createAuth({ DB: c.env.DB });

  try {
    // getSession handles both session cookies and API keys (when enableSessionForAPIKeys is enabled)
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      return c.json(
        { success: false, error: "Unauthorized - No valid session or API key" },
        401
      );
    }

    const userId = session.user.id;

    // Fetch full user details including role and banned status
    const db = getDbFromContext(c);
    const userResult = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
      },
    });

    if (!userResult) {
      return c.json(
        { success: false, error: "Unauthorized - User not found" },
        401
      );
    }

    if (userResult.banned) {
      return c.json(
        { success: false, error: "Forbidden - User is banned" },
        403
      );
    }

    // Add user to context
    c.set("user", {
      id: userResult.id,
      email: userResult.email,
      name: userResult.name,
      role: userResult.role,
    });

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json(
      { success: false, error: "Unauthorized - Authentication failed" },
      401
    );
  }
}

/**
 * Helper to get current user from context
 */
export function getCurrentUser(c: Context<{ Bindings: Env }>) {
  return c.get("user");
}

/**
 * Check if current user is an admin
 */
export function isAdmin(c: Context<{ Bindings: Env }>): boolean {
  const user = c.get("user");
  return user?.role === "admin";
}

/**
 * Middleware to require admin role
 * Must be used after requireAuth middleware
 */
export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next) {
  const user = c.get("user");

  if (!user) {
    return c.json(
      { success: false, error: "Unauthorized - Authentication required" },
      401
    );
  }

  if (user.role !== "admin") {
    return c.json(
      { success: false, error: "Forbidden - Admin access required" },
      403
    );
  }

  await next();
}

/**
 * Optional auth middleware - sets user if authenticated, continues regardless
 * Supports both session cookies and API key authentication
 */
export async function optionalAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = createAuth({ DB: c.env.DB });

  try {
    // getSession handles both session cookies and API keys
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    // If we have a valid session, fetch and set user details
    if (session?.user) {
      const userId = session.user.id;
      const db = getDbFromContext(c);
      const userResult = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
          banned: true,
        },
      });

      if (userResult && !userResult.banned) {
        c.set("user", {
          id: userResult.id,
          email: userResult.email,
          name: userResult.name,
          role: userResult.role,
        });
      }
    }
  } catch {
    // Silently ignore auth errors for optional auth
  }

  await next();
}
