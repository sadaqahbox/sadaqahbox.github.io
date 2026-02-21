/**
 * Server Connection Provider
 * 
 * Manages the server connection state and provides connection checking
 * functionality. When in static mode without a configured server,
 * certain features are disabled.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getApiBaseUrl } from "@/hooks/useServerUrl";

interface ServerConnectionState {
    isConnected: boolean;
    isChecking: boolean;
    lastError: string | null;
    checkConnection: () => Promise<boolean>;
}

const ServerConnectionContext = createContext<ServerConnectionState | null>(null);

export function useServerConnection(): ServerConnectionState {
    const context = useContext(ServerConnectionContext);
    if (!context) {
        throw new Error("useServerConnection must be used within ServerConnectionProvider");
    }
    return context;
}

interface ServerConnectionProviderProps {
    children: ReactNode;
}

export function ServerConnectionProvider({ children }: ServerConnectionProviderProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [lastError, setLastError] = useState<string | null>(null);

    const checkConnection = useCallback(async (): Promise<boolean> => {
        setIsChecking(true);
        setLastError(null);

        try {
            const apiUrl = getApiBaseUrl();
            const fullUrl = apiUrl.startsWith("http")
                ? `${apiUrl}/health`
                : `${window.location.origin}${apiUrl}/health`;

            const response = await fetch(fullUrl, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            // Check if response is JSON (not HTML fallback from SPA)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                setIsConnected(false);
                setLastError("Invalid response. Is the API server running?");
                return false;
            }

            if (response.ok) {
                const data = await response.json();
                if (data && typeof data === "object" && "status" in data &&
                    (data.status === "healthy" || data.status === "ok")) {
                    setIsConnected(true);
                    setLastError(null);
                    return true;
                }
                setIsConnected(false);
                setLastError("Unexpected response format");
                return false;
            } else {
                setIsConnected(false);
                setLastError(`Server returned ${response.status}`);
                return false;
            }
        } catch (err) {
            setIsConnected(false);
            setLastError(err instanceof Error ? err.message : "Connection failed");
            return false;
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Check connection on mount and when URL changes
    useEffect(() => {
        checkConnection();

        // Listen for storage changes (when user changes server URL in another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "sadaqahbox_server_url") {
                checkConnection();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [checkConnection]);

    const value: ServerConnectionState = {
        isConnected,
        isChecking,
        lastError,
        checkConnection,
    };

    return (
        <ServerConnectionContext.Provider value={value}>
            {children}
        </ServerConnectionContext.Provider>
    );
}
