import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import { SignedIn, SignedOut, UserButton } from "@daveyplate/better-auth-ui";
import { GithubIcon } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mosque01Icon } from "@hugeicons/core-free-icons";

export function Header() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <HugeiconsIcon icon={Mosque01Icon} className="text-primary size-5" />
          </div>
          <span className="font-bold text-xl">Sadaqah Box</span>
        </Link>
        <div className="flex items-center gap-4">
          <SignedIn>
            {!isDashboard && (
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            )}
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Link to="/auth/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </SignedOut>
          <ModeToggle />
          <Link to="https://github.com/sadaqah-box">
            <GithubIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          </Link>
        </div>
      </div>
    </header>
  );
}
