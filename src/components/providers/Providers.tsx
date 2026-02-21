import { AuthUIProvider, authViewPaths } from "@daveyplate/better-auth-ui";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { authClient, LinkComponent } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import { useNavigate } from "react-router-dom";

export function Providers({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthUIProvider
          authClient={authClient}
          navigate={navigate}
          Link={LinkComponent}
          apiKey={true}
          passkey={true}
        >
          {children}
          <Toaster />
        </AuthUIProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
