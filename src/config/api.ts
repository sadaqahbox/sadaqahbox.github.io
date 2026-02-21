/**
 * API Configuration
 * 
 * This file centralizes API URL configuration for the client-side.
 * When deploying to static hosts like GitHub Pages, set VITE_API_URL
 * to point to your Cloudflare Worker backend.
 */

// Default to relative URL when running in combined mode (Vite dev with Cloudflare plugin)
// When deploying statically, use the environment variable
const getApiBaseUrl = (): string => {
  // In development with the Cloudflare plugin, use relative URLs
  if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
    return "/api";
  }
  
  // Use the configured API URL (for static deployments)
  // This should be set when building for GitHub Pages or similar static hosts
  const configuredUrl = import.meta.env.VITE_API_URL;
  if (configuredUrl) {
    // Ensure no trailing slash to avoid double slashes
    return configuredUrl.replace(/\/$/, "");
  }
  
  // Fallback to relative URL (for same-origin deployment)
  return "/api";
};

const getAuthBaseUrl = (): string => {
  const apiBase = getApiBaseUrl();
  return `${apiBase}/auth`;
};

export const API_BASE = getApiBaseUrl();
export const AUTH_BASE = getAuthBaseUrl();

/**
 * Build a full API URL from an endpoint path
 */
export function buildApiUrl(endpoint: string): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE}${normalizedEndpoint}`;
}
