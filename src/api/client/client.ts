import { toast } from "sonner";
import type { z } from "zod";

const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<unknown> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    throw new ApiError(errorData.error || `HTTP ${response.status}`, response.status);
  }
  return response.json();
}

function handleError(error: unknown, defaultMessage: string): never {
  const message = error instanceof Error ? error.message : defaultMessage;
  toast.error(message);
  throw error;
}

async function request<T extends z.ZodType>(
  endpoint: string,
  schema: T,
  options?: RequestInit,
  errorMessage?: string
): Promise<z.infer<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: "include",
      ...options,
      headers: {
        ...options?.headers,
      },
    });
    const data = await handleResponse(response);
    return schema.parse(data);
  } catch (error) {
    return handleError(error, errorMessage || `Failed to request ${endpoint}`);
  }
}

function createRequestInit(method: string, body?: unknown): RequestInit {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return init;
}

export const api = {
  get: <T extends z.ZodType>(endpoint: string, schema: T) =>
    request(endpoint, schema, undefined, `Failed to fetch ${endpoint}`),

  post: <T extends z.ZodType>(endpoint: string, schema: T, body?: unknown) =>
    request(endpoint, schema, createRequestInit("POST", body), `Failed to post to ${endpoint}`),

  put: <T extends z.ZodType>(endpoint: string, schema: T, body?: unknown) =>
    request(endpoint, schema, createRequestInit("PUT", body), `Failed to update ${endpoint}`),

  del: <T extends z.ZodType>(endpoint: string, schema: T) =>
    request(endpoint, schema, { method: "DELETE" }, `Failed to delete ${endpoint}`),
};

export type { ApiError };
