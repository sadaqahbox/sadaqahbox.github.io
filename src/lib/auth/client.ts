import { passkeyClient } from "@better-auth/passkey/client";
import { apiKeyClient, usernameClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/auth";
import { getAuthBaseUrl } from "@/hooks/useServerUrl";

const getBaseURL = (): string => {
  // For SSR/server-side rendering, return empty string
  if (typeof window === "undefined") return "";
  
  const authBase = getAuthBaseUrl();
  
  // If authBase is an absolute URL (starts with http), use it directly
  if (authBase.startsWith("http")) {
    return authBase;
  }
  
  // Otherwise, construct from current origin (relative URL case)
  return `${window.location.origin}${authBase}`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    usernameClient(),
    apiKeyClient(),
    passkeyClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});

export type AuthClient = typeof authClient;
