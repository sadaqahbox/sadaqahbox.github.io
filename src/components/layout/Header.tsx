import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "./ModeToggle";
import { Logo } from "./Logo";
import { SignedIn, SignedOut, AuthLoading, UserButton } from "@daveyplate/better-auth-ui";
import { GithubIcon, MenuIcon, XIcon, LayoutDashboardIcon, ServerIcon, Loader2Icon } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ServerUrlDialog } from "@/components/settings";
import { useServerConnection } from "@/components/providers";

const userMenuLinks = [
  {
    href: "/dashboard",
    icon: <LayoutDashboardIcon className="h-4 w-4" />,
    label: "Dashboard" as React.ReactNode,
    signedIn: true,
  },
];

export function Header() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isLanding = location.pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isConnected, isChecking } = useServerConnection();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <div className="sticky top-0 z-50 w-full flex justify-center px-4 md:px-6 pt-4 pointer-events-none">
        <header
          className={cn(
            "pointer-events-auto transition-all duration-500 flex items-center justify-between h-16 w-full rounded-2xl md:rounded-full px-4 md:px-6",
            scrolled
              ? "bg-background/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-2xl shadow-primary/10 max-w-5xl"
              : "bg-transparent border-transparent max-w-7xl"
          )}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group text-foreground">
            <div className="relative">
              <div className={cn("absolute inset-0 bg-primary/20 rounded-full blur-md transition-opacity duration-300 opacity-0 group-hover:opacity-100", scrolled && "opacity-50")} />
              <Logo className="h-10 w-10 md:h-12 md:w-12 transition-transform duration-300 group-hover:scale-110 relative z-10" />
            </div>
            <span className="font-extrabold text-lg md:text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              SadaqahBox
            </span>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <AuthLoading>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20 rounded-full bg-primary/10" />
                <Skeleton className="h-8 w-8 rounded-full bg-primary/10" />
              </div>
            </AuthLoading>

            {isChecking ? (
              <Button variant="ghost" size="sm" disabled className="rounded-full">
                <Loader2Icon className="size-4 animate-spin mr-2" />
                Checking...
              </Button>
            ) : !isConnected ? (
              <ServerUrlDialog />
            ) : (
              <>
                <SignedIn>
                  {!isDashboard && (
                    <Link to="/dashboard">
                      <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <UserButton
                    size="icon"
                    className="h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
                    additionalLinks={userMenuLinks}
                  />
                </SignedIn>
                <SignedOut>
                  <Link to="/auth/sign-in">
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors font-medium">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/sign-up">
                    <Button size="sm" className="gap-1.5 rounded-full font-bold relative group overflow-hidden border-0">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-400 opacity-90 group-hover:opacity-100 transition-opacity" />
                      <span className="relative text-primary-foreground drop-shadow-md">Get Started</span>
                      <div className="absolute inset-0 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.7)] transition-shadow duration-300" />
                    </Button>
                  </Link>
                </SignedOut>
              </>
            )}
            <div className="w-px h-5 bg-border mx-2" />
            {isConnected && <ServerUrlDialog />}
            <div className="flex bg-muted/30 backdrop-blur-sm rounded-full border border-border/50 p-0.5 ml-1">
              <ModeToggle />
              <a
                href="https://github.com/sadaqahbox"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all size-8"
              >
                <GithubIcon className="size-[1.1rem]" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex bg-muted/30 backdrop-blur-sm rounded-full border border-border/50 p-0.5">
              <ModeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-background/80"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <XIcon className="size-4" />
                ) : (
                  <MenuIcon className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile Menu */}
      <div className="pointer-events-none fixed inset-0 z-40 flex justify-end items-start pt-[5.5rem] pr-4 md:pr-6">
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto md:hidden w-64 rounded-3xl border border-white/10 dark:border-white/5 bg-background/80 backdrop-blur-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className="flex flex-col gap-2">
                  {isChecking ? (
                    <Button variant="outline" className="w-full rounded-2xl" disabled>
                      <Loader2Icon className="size-4 animate-spin mr-2" />
                      Checking connection...
                    </Button>
                  ) : !isConnected ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                          Connect to a server to access the app.
                        </p>
                      </div>
                      <ServerUrlDialog />
                    </div>
                  ) : (
                    <>
                      <AuthLoading>
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-10 w-full rounded-2xl bg-primary/10" />
                          <Skeleton className="h-10 w-full rounded-2xl bg-primary/10" />
                        </div>
                      </AuthLoading>

                      <SignedIn>
                        {!isDashboard && (
                          <Link to="/dashboard">
                            <Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl h-12 hover:bg-primary/10 hover:text-primary">
                              <LayoutDashboardIcon className="size-4" />
                              <span className="font-semibold tracking-wide">Dashboard</span>
                            </Button>
                          </Link>
                        )}
                        <Link to="/account">
                          <Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl h-12 hover:bg-primary/10 hover:text-primary">
                            <span className="font-semibold tracking-wide">Account</span>
                          </Button>
                        </Link>
                        <Link to="/account/settings">
                          <Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl h-12 hover:bg-primary/10 hover:text-primary">
                            <span className="font-semibold tracking-wide">Settings</span>
                          </Button>
                        </Link>
                      </SignedIn>
                      <SignedOut>
                        <Link to="/auth/sign-in">
                          <Button variant="ghost" className="w-full rounded-2xl h-12 hover:bg-primary/10 hover:text-primary font-semibold tracking-wide">
                            Sign In
                          </Button>
                        </Link>
                        <Link to="/auth/sign-up">
                          <Button className="w-full rounded-2xl h-12 mt-2 gap-1.5 font-bold relative group overflow-hidden border-0">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-400 opacity-90 group-hover:opacity-100 transition-opacity" />
                            <span className="relative text-primary-foreground drop-shadow-md">Get Started</span>
                          </Button>
                        </Link>
                      </SignedOut>
                    </>
                  )}
                </div>

                <div className="flex justify-center pt-3 mt-3 border-t border-border/40">
                  <a
                    href="https://github.com/sadaqahbox"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    <GithubIcon className="size-4" />
                    GitHub
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
