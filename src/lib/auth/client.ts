import { passkeyClient } from "@better-auth/passkey/client";
import { apiKeyClient, usernameClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/auth";

const getBaseURL = () => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/auth`;
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
