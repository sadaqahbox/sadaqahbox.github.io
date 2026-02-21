import { Navigate, useParams } from "react-router-dom"
import { AuthView, SignedIn, SignedOut, AuthLoading } from "@daveyplate/better-auth-ui"
import { Header } from "@/components/layout"

export function AuthPage() {
  const { pathname } = useParams()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
        <AuthLoading>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </AuthLoading>

        <>
          <SignedIn>
            <Navigate to="/dashboard" replace />
          </SignedIn>
          <SignedOut>
            <AuthView pathname={pathname} />
          </SignedOut>
        </>
      </main>
    </div>
  )
}
