import { useParams } from "react-router-dom";
import { AccountView, SignedIn, SignedOut, RedirectToSignIn, AuthLoading, accountViewPaths, AccountSettingsCards } from "@daveyplate/better-auth-ui";
import { Header } from "@/components/layout";
import { UpdatePreferredCurrencyCard } from "./UpdatePreferredCurrencyCard";

export function AccountPage() {
  const { pathname } = useParams();
  // Only show preferences on settings page
  const showPreferences = pathname === accountViewPaths.SETTINGS;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
        <AuthLoading>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </AuthLoading>

        <SignedIn>
          {showPreferences ? (
            <>
              <AccountView pathname={pathname} />
              <div className="flex w-full flex-col items-end gap-4 md:gap-6">
                <UpdatePreferredCurrencyCard />
              </div>
            </>
          ) : (
            <AccountView pathname={pathname} />
          )}
        </SignedIn>

        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </main>
    </div>
  );
}
