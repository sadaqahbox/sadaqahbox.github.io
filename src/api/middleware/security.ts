/**
 * Security headers middleware
 * 
 * Adds security headers to all responses to protect against common attacks:
 * - CSP (Content Security Policy)
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options (Clickjacking protection)
 * - X-Content-Type-Options (MIME sniffing protection)
 * - Referrer-Policy
 */

import type { Context, Next } from "hono";

/**
 * Security headers configuration
 */
interface SecurityHeadersConfig {
  /** Content Security Policy directive */
  contentSecurityPolicy?: string;
  /** HSTS max age in seconds (default: 1 year) */
  hstsMaxAge?: number;
  /** Whether to include subdomains in HSTS */
  hstsIncludeSubdomains?: boolean;
  /** X-Frame-Options value (default: DENY) */
  frameOptions?: "DENY" | "SAMEORIGIN";
  /** Referrer-Policy value (default: strict-origin-when-cross-origin) */
  referrerPolicy?: string;
  /** Permissions-Policy value */
  permissionsPolicy?: string;
}

const DEFAULT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const DEFAULT_PERMISSIONS_POLICY = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
].join(", ");

/**
 * Security headers middleware factory
 */
export function securityHeaders(config: SecurityHeadersConfig = {}) {
  const {
    contentSecurityPolicy = DEFAULT_CSP,
    hstsMaxAge = 31536000, // 1 year
    hstsIncludeSubdomains = true,
    frameOptions = "DENY",
    referrerPolicy = "strict-origin-when-cross-origin",
    permissionsPolicy = DEFAULT_PERMISSIONS_POLICY,
  } = config;

  return async function securityHeadersMiddleware(c: Context, next: Next) {
    // Add security headers to response
    c.header("Content-Security-Policy", contentSecurityPolicy);
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", frameOptions);
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", referrerPolicy);
    c.header("Permissions-Policy", permissionsPolicy);
    
    // Add HSTS header (only over HTTPS)
    const protocol = c.req.header("x-forwarded-proto") || c.req.header("cloudfront-forwarded-proto");
    if (protocol === "https" || c.req.url.startsWith("https://")) {
      const hstsValue = `max-age=${hstsMaxAge}${hstsIncludeSubdomains ? "; includeSubDomains" : ""}`;
      c.header("Strict-Transport-Security", hstsValue);
    }

    await next();
  };
}

/**
 * Simple security headers middleware with default configuration
 */
export async function defaultSecurityHeaders(c: Context, next: Next) {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  
  await next();
}
