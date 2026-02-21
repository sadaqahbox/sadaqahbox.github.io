// Hooks are provided by authClient from better-auth/react
// These same hooks are passed to AuthUIProvider for library components to use
import { authClient } from "./client";

// Export useSession directly from authClient
export const useSession = authClient.useSession;

// useUser is a simple wrapper around useSession
export function useUser() {
  const { data, isPending, error, refetch } = useSession();
  return {
    data: data?.user ?? null,
    isPending,
    error,
    refetch,
  };
}

// Export hooks object for AuthUIProvider
export const hooks = {
  useSession,
  useUser,
};
