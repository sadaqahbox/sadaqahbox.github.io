import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "./ModeToggle";
import { SignedIn, SignedOut, AuthLoading, UserButton } from "@daveyplate/better-auth-ui";
import { GithubIcon, MenuIcon, XIcon, LayoutDashboardIcon } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mosque01Icon } from "@hugeicons/core-free-icons";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#about", label: "About" },
];

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105">
            <HugeiconsIcon icon={Mosque01Icon} className="text-primary size-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Sadaqah Box</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {isLanding &&
            navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                {link.label}
              </a>
            ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <AuthLoading>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </AuthLoading>

          <SignedIn>
            {!isDashboard && (
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  Dashboard
                </Button>
              </Link>
            )}
            <UserButton
              size="icon"
              className="h-9 w-9 rounded-full"
              additionalLinks={userMenuLinks}
            />
          </SignedIn>
          <SignedOut>
            <Link to="/auth/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth/sign-up">
              <Button size="sm" className="gap-1.5">
                Get Started
              </Button>
            </Link>
          </SignedOut>
          <div className="w-px h-4 bg-border mx-1" />
          <ModeToggle />
          <a
            href="https://github.com/sadaqah-box"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors size-8"
          >
            <GithubIcon className="size-[1.1rem]" />
            <span className="sr-only">GitHub</span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <XIcon className="size-5" />
            ) : (
              <MenuIcon className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {isLanding && (
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              )}

              <div className="h-px bg-border" />

              <div className="flex flex-col gap-2">
                <AuthLoading>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </AuthLoading>

                <SignedIn>
                  {!isDashboard && (
                    <Link to="/dashboard">
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <LayoutDashboardIcon className="size-4" />
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Link to="/account">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      Account
                    </Button>
                  </Link>
                  <Link to="/account/settings">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      Settings
                    </Button>
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link to="/auth/sign-in">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/sign-up">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </SignedOut>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://github.com/sadaqah-box"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GithubIcon className="size-4" />
                  GitHub
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
