import { useParams } from "react-router-dom"
import { AccountView } from "@daveyplate/better-auth-ui"
import { Header } from "@/components/layout"

export function AuthPage() {
  const { pathname } = useParams()

  // For other auth routes (sign-in, sign-up, forgot-password, etc.)
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
        <AccountView pathname={pathname} />
      </main>
    </div>
  )
}

