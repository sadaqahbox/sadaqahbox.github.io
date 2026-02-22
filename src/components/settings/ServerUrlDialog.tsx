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
                            "gap-2 rounded-full px-3",
                            isConnected && "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:text-emerald-300",
                            !isConnected && "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 dark:text-amber-400 dark:hover:text-amber-300"
                        )}
                        title="Configure API server"
                    >
                        <ServerIcon className="size-4" />
                        <span className="hidden sm:inline font-medium">Server</span>
                        {isConfigured && (
                            <span className="sr-only">(Custom server configured)</span>
                        )}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-3xl overflow-hidden border-border/50 bg-background/80 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] p-0">
                {/* Glowing decorative top edge */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-emerald-400/50 to-primary/30" />

                <div className="p-6 md:p-8 space-y-6">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                <ServerIcon className="size-5 text-primary" strokeWidth={2.5} />
                            </div>
                            API Server Configuration
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground/80 leading-relaxed max-w-[90%]">
                            Configure which API server to connect to.
                            {import.meta.env.VITE_IS_STATIC_BUILD ? "" : " Leave empty to use the same server that hosts this app."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="space-y-3">
                            <Label htmlFor="server-url" className="text-sm font-semibold tracking-wide text-foreground/80">
                                Server URL
                            </Label>
                            <Input
                                id="server-url"
                                placeholder="https://your-worker.workers.dev"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="font-mono text-base h-12 bg-muted/30 border-border/50 focus-visible:ring-primary/40 focus-visible:border-primary/50 rounded-xl px-4"
                            />
                            <p className="text-xs text-muted-foreground font-medium pl-1">
                                Example: <span className="text-foreground/60 font-mono">https://my-sadaqahbox.workers.dev</span>
                            </p>
                        </div>

                        {testResult && (
                            <div className={cn(
                                "flex items-start gap-3 p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-bottom-2",
                                testResult.success
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                                    : "bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300"
                            )}>
                                {testResult.success ? (
                                    <CheckIcon className="size-5 shrink-0 mt-0.5 text-emerald-500" />
                                ) : (
                                    <AlertCircleIcon className="size-5 shrink-0 mt-0.5 text-red-500" />
                                )}
                                <span className="break-all font-medium leading-relaxed">{testResult.message}</span>
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground/80 space-y-2.5 p-4 rounded-xl bg-muted/20 border border-border/30 font-medium">
                            <div className="flex items-center gap-2">
                                <span className="w-20 shrink-0">Current:</span>
                                <code className="bg-background px-2 py-1 rounded-md text-foreground/80 truncate shadow-sm border border-border/50">{displayUrl}</code>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-20 shrink-0">API path:</span>
                                <code className="bg-background px-2 py-1 rounded-md text-foreground/80 truncate shadow-sm border border-border/50">{storedUrl || "/api"}</code>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-border/40">
                        {isConfigured && (
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="w-full sm:w-auto gap-2 rounded-xl h-11 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                            >
                                <RotateCcwIcon className="size-4" />
                                Reset
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            onClick={handleTest}
                            disabled={isTesting}
                            className="w-full sm:w-auto gap-2 rounded-xl h-11 bg-secondary/60 hover:bg-secondary/80 text-secondary-foreground font-semibold transition-colors"
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
                            className="w-full sm:w-auto gap-2 rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                        >
                            <ServerIcon className="size-4" />
                            Save & Reload
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
