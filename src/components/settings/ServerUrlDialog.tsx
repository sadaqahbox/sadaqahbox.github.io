/**
 * Server URL Configuration Dialog
 *
 * Allows users to configure which API server to connect to.
 * Useful for self-hosting or connecting to different environments.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServerIcon, CheckIcon, AlertCircleIcon, Loader2Icon, RotateCcwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServerConnection } from "@/components/providers";

const STORAGE_KEY = "sadaqahbox_server_url";

function normalizeUrl(url: string): string {
    let normalized = url.trim().replace(/\/$/, "");
    if (normalized && !normalized.endsWith("/api")) {
        normalized = `${normalized}/api`;
    }
    return normalized;
}

function getHealthCheckUrl(apiBase: string): string {
    if (apiBase.startsWith("http")) {
        return `${apiBase}/health`;
    }
    // Relative URL - use current origin
    return `${window.location.origin}${apiBase}/health`;
}

async function testServerConnection(apiBase: string): Promise<{ success: boolean; error?: string }> {
    const healthUrl = getHealthCheckUrl(apiBase);

    try {
        const response = await fetch(healthUrl, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });

        // Check if response is JSON (not HTML fallback)
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return {
                success: false,
                error: "Invalid response. Is the API server running?"
            };
        }

        if (response.ok) {
            // Try to parse JSON and check for expected health response
            const data = await response.json();
            if (data && typeof data === "object" && "status" in data &&
                (data.status === "healthy" || data.status === "ok")) {
                return { success: true };
            }
            return {
                success: false,
                error: "Unexpected response format from server"
            };
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
}

export function ServerUrlDialog({ children }: { children?: React.ReactNode }) {
    const { isConnected } = useServerConnection();
    const storedUrl = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) || "" : "";
    const [inputValue, setInputValue] = useState(storedUrl.replace(/\/api$/, ""));
    const [isOpen, setIsOpen] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const isConfigured = !!storedUrl;

    const handleSave = () => {
        const normalized = normalizeUrl(inputValue);

        if (normalized) {
            localStorage.setItem(STORAGE_KEY, normalized);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }

        setTestResult({ success: true, message: "Settings saved. Refreshing..." });

        // Give user time to see the message, then reload
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);

        // Get the API base URL to test (from input, not localStorage)
        const normalizedInput = normalizeUrl(inputValue);
        const apiBase = normalizedInput || "/api";

        const result = await testServerConnection(apiBase);

        setIsTesting(false);
        setTestResult({
            success: result.success,
            message: result.success
                ? `Connection successful! (${apiBase})`
                : `Connection failed: ${result.error}`,
        });
    };

    const handleReset = () => {
        localStorage.removeItem(STORAGE_KEY);
        setInputValue("");
        setTestResult({ success: true, message: "Reset to default. Refreshing..." });
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            // Reset input to current value when opening
            setInputValue(storedUrl.replace(/\/api$/, ""));
            setTestResult(null);
        }
    };

    const displayUrl = isConfigured
        ? storedUrl.replace(/\/api$/, "")
        : "Default (same server)";

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "gap-2",
                            isConnected && "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
                            !isConnected && "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        )}
                        title="Configure API server"
                    >
                        <ServerIcon className="size-4" />
                        <span className="hidden sm:inline">Server</span>
                        {isConfigured && (
                            <span className="sr-only">(Custom server configured)</span>
                        )}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ServerIcon className="size-5" />
                        API Server Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Configure which API server to connect to.
                        {import.meta.env.VITE_IS_STATIC_BUILD ? "" : " Leave empty to use the same server that hosts this app."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="server-url">
                            Server URL
                        </Label>
                        <Input
                            id="server-url"
                            placeholder="https://your-worker.workers.dev"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Example: https://my-sadaqahbox.workers.dev
                        </p>
                    </div>

                    {testResult && (
                        <div className={cn(
                            "flex items-start gap-2 text-sm p-3 rounded-md",
                            testResult.success
                                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                        )}>
                            {testResult.success ? (
                                <CheckIcon className="size-4 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                            )}
                            <span className="break-all">{testResult.message}</span>
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>Current: <code className="bg-muted px-1 py-0.5 rounded">{displayUrl}</code></p>
                        <p>Full API path: <code className="bg-muted px-1 py-0.5 rounded">{storedUrl || "/api"}</code></p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {isConfigured && (
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="w-full sm:w-auto gap-2"
                        >
                            <RotateCcwIcon className="size-4" />
                            Reset
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        onClick={handleTest}
                        disabled={isTesting}
                        className="w-full sm:w-auto gap-2"
                    >
                        {isTesting ? (
                            <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                            <CheckIcon className="size-4" />
                        )}
                        Test Connection
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="w-full sm:w-auto gap-2"
                    >
                        <ServerIcon className="size-4" />
                        Save & Reload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
