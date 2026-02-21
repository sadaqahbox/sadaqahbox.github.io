import { toast } from "sonner";
import type { ApiResponse } from "@/types";

const API_BASE = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function handleError(error: unknown, defaultMessage: string): never {
  const message = error instanceof Error ? error.message : defaultMessage;
  toast.error(message);
  throw error;
}

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        credentials: "include",
      });
      return handleResponse<T>(response);
    } catch (error) {
      return handleError(error, `Failed to fetch ${endpoint}`);
    }
  },

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(response);
    } catch (error) {
      return handleError(error, `Failed to post to ${endpoint}`);
    }
  },

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(response);
    } catch (error) {
      return handleError(error, `Failed to update ${endpoint}`);
    }
  },

  async del<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "DELETE",
        credentials: "include",
      });
      return handleResponse<T>(response);
    } catch (error) {
      return handleError(error, `Failed to delete ${endpoint}`);
    }
  },
};
