import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout";
import { SignedIn, SignedOut, UserButton } from "@daveyplate/better-auth-ui";
import { Heart, ShieldCheck, BarChart3, ArrowRight } from "lucide-react";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-200/20 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-800/20 pointer-events-none" />
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Track Your <span className="text-primary">Sadaqah</span> with Ease
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  A modern, secure, and private way to manage your charity boxes and sadaqah contributions.
                  Visualize your giving and stay consistent.
                </p>
              </div>
              <div className="space-x-4">
                <SignedOut>
                  <Link to="/auth/sign-up">
                    <Button size="lg" className="h-11 px-8 gap-2">
                      Start Tracking Free <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/auth/sign-in">
                    <Button variant="outline" size="lg" className="h-11 px-8">
                      Sign In
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link to="/dashboard">
                    <Button size="lg" className="h-11 px-8 gap-2">
                      Go to Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Visual Analytics</h3>
                <p className="text-muted-foreground">
                  See your contributions grow over time with beautiful charts and statistics.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Private & Secure</h3>
                <p className="text-muted-foreground">
                  Your data is encrypted and secure. We respect your privacy and data ownership.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Multiple Boxes</h3>
                <p className="text-muted-foreground">
                  Create different boxes for various causes or family members. Organize your giving.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto px-4 md:px-6">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left flex items-center gap-1">
            Built with <Heart className="size-4 inline fill-current" /> for the Ummah.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="#" className="hover:underline underline-offset-4">Privacy</Link>
            <Link to="#" className="hover:underline underline-offset-4">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
