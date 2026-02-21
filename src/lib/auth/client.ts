import { passkeyClient } from "@better-auth/passkey/client";
import { apiKeyClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

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
  ],
});

export type AuthClient = typeof authClient;
