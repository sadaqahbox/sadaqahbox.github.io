/**
 * Authentication middleware
 * 
 * Verifies the session token and adds the user to the context.
 */

import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { sessions, users } from "../../db/auth.schema";
import { eq } from "drizzle-orm";
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
 * Verifies the session token from cookies and adds user to context
 */
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  // Get session token from cookie
  const sessionToken = getCookie(c, "better-auth.session_token") || 
                       getCookie(c, "session_token");
  
  if (!sessionToken) {
    return c.json(
      { success: false, error: "Unauthorized - No session token" },
      401
    );
  }

  const db = getDbFromContext(c);

  // Look up session
  const sessionResult = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, sessionToken))
    .limit(1);

  const session = sessionResult[0];

  if (!session) {
    return c.json(
      { success: false, error: "Unauthorized - Invalid session" },
      401
    );
  }

  // Check if session is expired
  if (new Date(session.expiresAt) < new Date()) {
    return c.json(
      { success: false, error: "Unauthorized - Session expired" },
      401
    );
  }

  // Get user
  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      banned: users.banned,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    return c.json(
      { success: false, error: "Unauthorized - User not found" },
      401
    );
  }

  // Check if user is banned
  if (user.banned) {
    return c.json(
      { success: false, error: "Forbidden - User is banned" },
      403
    );
  }

  // Add user to context
  c.set("user", {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await next();
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
