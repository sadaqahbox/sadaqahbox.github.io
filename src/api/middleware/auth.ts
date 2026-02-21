/**
 * Authentication middleware
 * 
 * Uses better-auth's built-in session verification for secure authentication.
 * Falls back to manual verification for edge cases.
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
 * Uses better-auth's built-in session API for verification
 */
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = createAuth({ DB: c.env.DB });
  
  try {
    // Use better-auth's getSession API
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      return c.json(
        { success: false, error: "Unauthorized - No valid session" },
        401
      );
    }

    // Fetch full user details including role and banned status
    const db = getDbFromContext(c);
    const userResult = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, session.user.id),
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
      { success: false, error: "Unauthorized - Session verification failed" },
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
 * Useful for public endpoints that have enhanced features for logged-in users
 */
export async function optionalAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = createAuth({ DB: c.env.DB });
  
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session?.user) {
      // Fetch full user details including role
      const db = getDbFromContext(c);
      const userResult = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, session.user.id),
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
