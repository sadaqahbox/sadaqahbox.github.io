/**
 * Server URL Configuration Hook
 *
 * Manages the API server URL in localStorage.
 * Users can set this to point to their own Cloudflare Worker instance.
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "sadaqahbox_server_url";

// Default: use same-origin (for combined deployment or dev)
const DEFAULT_URL = "";

export interface ServerUrlConfig {
    /** The configured server URL (empty string means same-origin) */
    url: string;
    /** Whether the URL has been explicitly set by the user */
    isConfigured: boolean;
    /** Set a new server URL */
    setUrl: (url: string) => void;
    /** Reset to default (same-origin) */
    reset: () => void;
    /** Test if the server is reachable */
    testConnection: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * Get the effective API base URL
 * Returns the configured URL or falls back to same-origin
 */
export function getApiBaseUrl(): string {
    if (typeof window === "undefined") return import.meta.env.VITE_API_URL || "/api";
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || import.meta.env.VITE_API_URL || DEFAULT_URL || "/api";
}

/**
 * Get the effective auth base URL
 */
export function getAuthBaseUrl(): string {
    const base = getApiBaseUrl();
    if (base.endsWith("/api")) {
        return `${base}/auth`;
    }
    return `${base.replace(/\/$/, "")}/auth`;
}

/**
 * Build a full API URL from an endpoint path
 */
export function buildApiUrl(endpoint: string): string {
    const base = getApiBaseUrl();
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${base}${normalizedEndpoint}`;
}

/**
 * Hook for managing server URL configuration
 */
export function useServerUrl(): ServerUrlConfig {
    const [url, setUrlState] = useState<string>(DEFAULT_URL);
    const [isConfigured, setIsConfigured] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            setUrlState(stored);
            setIsConfigured(true);
        }
        setIsInitialized(true);
    }, []);

    // Save to localStorage when changed
    const setUrl = useCallback((newUrl: string) => {
        const trimmed = newUrl.trim();

        if (trimmed === "") {
            // Empty means use same-origin
            localStorage.removeItem(STORAGE_KEY);
            setUrlState("");
            setIsConfigured(false);
        } else {
            // Store the URL (ensure it ends with /api)
            let normalized = trimmed;
            // Remove trailing slash
            normalized = normalized.replace(/\/$/, "");
            // Ensure /api suffix
            if (!normalized.endsWith("/api")) {
                normalized = `${normalized}/api`;
            }
            localStorage.setItem(STORAGE_KEY, normalized);
            setUrlState(normalized);
            setIsConfigured(true);
        }
    }, []);

    const reset = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setUrlState("");
        setIsConfigured(false);
    }, []);

    const testConnection = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        const testUrl = url || getApiBaseUrl();

        try {
            const response = await fetch(`${testUrl}/health`, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: `Server returned ${response.status}: ${response.statusText}`
                };
            }
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "Network error - check URL and CORS settings"
            };
        }
    }, [url]);

    return {
        url,
        isConfigured,
        setUrl,
        reset,
        testConnection,
    };
}
