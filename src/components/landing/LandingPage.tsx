import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header, Logo } from "@/components/layout";
import { SignedIn, SignedOut } from "@daveyplate/better-auth-ui";
import { useServerConnection } from "@/components/providers";
import { ServerUrlDialog } from "@/components/settings";
import {
  Heart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Quote,
  BookOpen,
  Sparkles,
  Wallet,
  Globe,
  Smartphone,
  Moon,
  FileText,
  History,
  TrendingUp,
  Package,
  Gift,
  Clock,
  Shield,
  ServerIcon,
  Loader2Icon,
} from "lucide-react";
import quotesData from "@/data/quotes.json";
import { WheatScrollAnimation } from "./WheatScrollAnimation";

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// Quote type definition
interface QuoteItem {
  id: string;
  type: "ayah" | "hadith";
  content: string;
  reference: string;
  arabic?: string;
}

// Prepare quotes for carousel
const prepareQuotes = (): QuoteItem[] => {
  const ayahs: QuoteItem[] = quotesData.ayahs.slice(0, 5).map((ayah) => ({
    id: ayah.id,
    type: "ayah" as const,
    content: ayah.translation.en,
    reference: `${ayah.surah} ${ayah.verse}`,
    arabic: ayah.arabic,
  }));

  const hadiths: QuoteItem[] = quotesData.hadiths.slice(0, 5).map((hadith) => ({
    id: hadith.id,
    type: "hadith" as const,
    content: hadith.translation.en,
    reference: hadith.source.split(",")[0] ?? hadith.source,
  }));

  // Interleave ayahs and hadiths
  const mixed: QuoteItem[] = [];
  for (let i = 0; i < Math.max(ayahs.length, hadiths.length); i++) {
    const ayah = ayahs[i];
    const hadith = hadiths[i];
    if (ayah) mixed.push(ayah);
    if (hadith) mixed.push(hadith);
  }
  return mixed;
};

const allQuotes = prepareQuotes();

// Quote Carousel Component
function QuoteCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = allQuotes.length - 1;
      if (nextIndex >= allQuotes.length) nextIndex = 0;
      return nextIndex;
    });
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => paginate(1), 10000);
    return () => clearInterval(timer);
  }, [paginate, isPaused]);

  useEffect(() => {
    const element = carouselRef.current;
    if (!element) return;

    const handleFocusIn = () => setIsPaused(true);
    const handleFocusOut = (e: FocusEvent) => {
      // Only unpause if focus is leaving the carousel entirely
      if (!element.contains(e.relatedTarget as Node)) {
        setIsPaused(false);
      }
    };
    const handleMouseEnter = () => setIsPaused(true);
    const handleMouseLeave = () => setIsPaused(false);

    element.addEventListener("focusin", handleFocusIn);
    element.addEventListener("focusout", handleFocusOut);
    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("focusin", handleFocusIn);
      element.removeEventListener("focusout", handleFocusOut);
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const currentQuote = allQuotes[currentIndex];
  if (!currentQuote) return null;

  return (
    <div ref={carouselRef} className="relative max-w-4xl mx-auto">
      {/* Card with auto height */}
      <div className="relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/10 border-primary/10">
              <CardContent className="p-6 sm:p-10">
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`p-3 rounded-full mb-5 ${currentQuote.type === "ayah"
                      ? "bg-primary/10 text-primary"
                      : "bg-amber-500/10 text-amber-600"
                      }`}
                  >
                    {currentQuote.type === "ayah" ? (
                      <BookOpen className="h-5 w-5" />
                    ) : (
                      <Quote className="h-5 w-5" />
                    )}
                  </motion.div>

                  {currentQuote.arabic && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-base sm:text-lg font-arabic leading-relaxed mb-4 max-w-3xl"
                      dir="rtl"
                    >
                      {currentQuote.arabic}
                    </motion.p>
                  )}

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm sm:text-base text-foreground/80 leading-relaxed italic mb-5 max-w-2xl"
                  >
                    &ldquo;{currentQuote.content}&rdquo;
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center gap-2"
                  >
                    <Badge
                      variant={
                        currentQuote.type === "ayah" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {currentQuote.type === "ayah" ? "Quran" : "Hadith"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {currentQuote.reference}
                    </span>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => paginate(-1)}
          className="rounded-full h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-1.5">
          {allQuotes.map((quote, index) => (
            <button
              key={quote.id}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                ? "bg-primary w-5"
                : "bg-primary/20 w-1.5 hover:bg-primary/40"
                }`}
              aria-label={`Go to quote ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => paginate(1)}
          className="rounded-full h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function HeroButtons() {
  const { isConnected, isChecking } = useServerConnection();

  if (isChecking) {
    return (
      <Button size="lg" disabled className="gap-2 px-6">
        <Loader2Icon className="h-4 w-4 animate-spin" />
        Checking connection...
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <>
        <ServerUrlDialog>
          <Button size="lg" className="gap-2 px-6">
            Start Tracking Free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </ServerUrlDialog>
        <ServerUrlDialog>
          <Button variant="outline" size="lg" className="px-6">
            Sign In
          </Button>
        </ServerUrlDialog>
      </>
    );
  }

  return (
    <>
      <SignedOut>
        <Link to="/auth/sign-up">
          <Button size="lg" className="gap-2 px-6">
            Start Tracking Free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/auth/sign-in">
          <Button variant="outline" size="lg" className="px-6">
            Sign In
          </Button>
        </Link>
      </SignedOut>
      <SignedIn>
        <Link to="/dashboard">
          <Button size="lg" className="gap-2 px-6">
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </SignedIn>
    </>
  );
}

function CTAButtons() {
  const { isConnected, isChecking } = useServerConnection();

  if (isChecking) {
    return (
      <Button size="lg" disabled className="gap-2 px-6">
        <Loader2Icon className="h-4 w-4 animate-spin" />
        Checking connection...
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <ServerUrlDialog>
        <Button size="lg" className="gap-2 px-6">
          Get Started Free
          <ArrowRight className="h-4 w-4" />
        </Button>
      </ServerUrlDialog>
    );
  }

  return (
    <>
      <SignedOut>
        <Link to="/auth/sign-up">
          <Button size="lg" className="gap-2 px-6">
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </SignedOut>
      <SignedIn>
        <Link to="/dashboard">
          <Button size="lg" className="gap-2 px-6">
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </SignedIn>
    </>
  );
}

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Wheat SVG Scroll Animation - fixed bottom-right */}
        <WheatScrollAnimation />

        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
          {/* Advanced Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-30"></div>

            <motion.div
              animate={{ y: [0, -30, 0], opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[8rem] mix-blend-screen"
            />
            <motion.div
              animate={{ y: [0, 40, 0], opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[8rem] mix-blend-screen"
            />
          </div>

          <div className="container px-4 md:px-6 mx-auto relative z-10 flex flex-col items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col items-center text-center max-w-4xl mx-auto"
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="outline" className="mb-6 px-4 py-2 rounded-full border-primary/30 bg-primary/10 text-primary backdrop-blur-md">
                  <Sparkles className="w-4 h-4 mr-2 inline-block" />
                  <span className="font-semibold tracking-wide">Track Your Charity Journey</span>
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1]"
              >
                Track Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-emerald-600 relative inline-block">
                  Sadaqah
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 sm:h-4 opacity-70"
                    viewBox="0 0 200 12"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <motion.path
                      d="M2 8C50 2 150 2 198 8"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="text-emerald-500/40"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl leading-relaxed tracking-wide"
              >
                A beautiful, modern way to manage your charity boxes
                and track your charitable giving consistently.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 justify-center items-center">
                <HeroButtons />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Why Sadaqah Box Section */}
        <section className="py-24 md:py-32 relative overflow-hidden bg-background">
          {/* Decorative backdrop elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[100px] rounded-[100%] rounded-t-none opacity-50 pointer-events-none" />

          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-16 md:mb-24"
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="outline" className="mb-6 px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary">
                  <Gift className="w-4 h-4 mr-2 inline-block" />
                  Our Purpose
                </Badge>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                Why Sadaqah Box?
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                Giving sadaqah every day is a beautiful Sunnah, but life gets busy.
                We built this tool to make consistent charity effortless.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto"
            >
              {[
                {
                  icon: Clock,
                  title: "Daily Reminder",
                  desc: "The Prophet ﷺ taught us that every joint of our body requires sadaqah each day the sun rises. Drop your contribution in a virtual box daily—we'll hold it safely until you're ready to give.",
                  color: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_2rem_-0.5rem_rgba(16,185,129,0.5)]",
                  glowColor: "bg-primary/20",
                  borderColor: "hover:border-primary/40 border-border/50",
                },
                {
                  icon: Wallet,
                  title: "Accumulate & Give",
                  desc: "Whether it's a few coins or a larger amount, set aside sadaqah daily in your boxes. When the time is right, collect and distribute to those in need—all at once or box by box.",
                  color: "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-amber-50 group-hover:shadow-[0_0_2rem_-0.5rem_#f59e0b]",
                  glowColor: "bg-amber-500/20",
                  borderColor: "hover:border-amber-500/40 border-border/50",
                },
                {
                  icon: Shield,
                  title: "Fulfill Your Promise",
                  desc: "When you add sadaqah to a box, you're making a commitment to give. We help you track what you've set aside so you can fulfill that promise and ensure your charity actually reaches those in need.",
                  color: "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-emerald-50 group-hover:shadow-[0_0_2rem_-0.5rem_#10b981]",
                  glowColor: "bg-emerald-500/20",
                  borderColor: "hover:border-emerald-500/40 border-border/50",
                },
              ].map((item, idx) => (
                <motion.div key={item.title} variants={scaleIn} className={`group relative overflow-hidden rounded-[2rem] border bg-card/40 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${item.borderColor}`}>
                  {/* Glowing background spot */}
                  <div className={`absolute -right-24 -top-24 h-56 w-56 rounded-full blur-[4rem] transition-all duration-700 group-hover:scale-[1.5] opacity-30 ${item.glowColor}`} />

                  <div className="relative flex h-full flex-col p-8 md:p-10">
                    <div className={`mb-8 w-fit rounded-2xl p-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 border border-transparent group-hover:border-white/10 ${item.color}`}>
                      <item.icon className="h-8 w-8 transition-transform duration-500" strokeWidth={1.5} />
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold tracking-tight mb-4 transition-colors duration-300 group-hover:text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-base leading-relaxed overflow-hidden transition-colors duration-300 group-hover:text-foreground/80">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-16 md:mt-20 text-center"
            >
              <div className="inline-flex flex-col items-center justify-center p-6 md:p-8 rounded-[2rem] bg-secondary/20 border border-secondary/30 max-w-2xl mx-auto backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                <Quote className="h-6 w-6 text-primary/40 mb-4" />
                <p className="text-base md:text-lg text-foreground/90 italic tracking-wide leading-relaxed">
                  "There is a sadaqah to be given for every joint of the human body
                  every day the sun rises."
                </p>
                <span className="mt-4 text-sm font-semibold text-primary uppercase tracking-widest">— Sahih al-Bukhari 2989</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 md:py-32 relative overflow-hidden bg-background">
          {/* Subtle Grid Pattern Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-16 md:mb-24"
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="outline" className="mb-6 px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary">
                  <Sparkles className="w-4 h-4 mr-2 inline-block" />
                  Powerful Features
                </Badge>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                Everything you need <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                  in one place.
                </span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                Meticulously crafted tools to help you stay consistent with your charitable giving and track your impact over time.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto auto-rows-[minmax(14rem,auto)]"
            >
              {[
                {
                  icon: Package,
                  title: "Multiple Boxes",
                  desc: "Create separate boxes for different causes, family members, or charities. Manage all your sadaqah intentions beautifully in one modern interface.",
                  color: "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-emerald-50 group-hover:shadow-[0_0_2rem_-0.5rem_#10b981]",
                  glowColor: "bg-emerald-500/20",
                  borderColor: "hover:border-emerald-500/40 border-border/50",
                  className: "md:col-span-2 md:row-span-2",
                  isLarge: true,
                },
                {
                  icon: Globe,
                  title: "Multi-Currency",
                  desc: "Track donations flawlessly in any global currency. Fiat, crypto, and commodities fully supported.",
                  color: "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-blue-50 group-hover:shadow-[0_0_2rem_-0.5rem_#3b82f6]",
                  glowColor: "bg-blue-500/20",
                  borderColor: "hover:border-blue-500/40 border-border/50",
                  className: "md:col-span-2",
                },
                {
                  icon: Wallet,
                  title: "Easy Tracking",
                  desc: "Quickly add sadaqah entries with automatic value calculations.",
                  color: "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-amber-50 group-hover:shadow-[0_0_2rem_-0.5rem_#f59e0b]",
                  glowColor: "bg-amber-500/20",
                  borderColor: "hover:border-amber-500/40 border-border/50",
                  className: "md:col-span-1",
                },
                {
                  icon: History,
                  title: "Your History",
                  desc: "View complete history when you empty your boxes. Track over time.",
                  color: "bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-violet-50 group-hover:shadow-[0_0_2rem_-0.5rem_#8b5cf6]",
                  glowColor: "bg-violet-500/20",
                  borderColor: "hover:border-violet-500/40 border-border/50",
                  className: "md:col-span-1",
                },
                {
                  icon: FileText,
                  title: "PDF Reports",
                  desc: "Generate stunning PDF receipts for collections with full details.",
                  color: "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-rose-50 group-hover:shadow-[0_0_2rem_-0.5rem_#f43f5e]",
                  glowColor: "bg-rose-500/20",
                  borderColor: "hover:border-rose-500/40 border-border/50",
                  className: "md:col-span-1",
                },
                {
                  icon: TrendingUp,
                  title: "Deep Statistics",
                  desc: "Visualize giving patterns, track box counts, and get sadaqah statistics at a glance.",
                  color: "bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-cyan-50 group-hover:shadow-[0_0_2rem_-0.5rem_#06b6d4]",
                  glowColor: "bg-cyan-500/20",
                  borderColor: "hover:border-cyan-500/40 border-border/50",
                  className: "md:col-span-2",
                },
                {
                  icon: Moon,
                  title: "Dark Mode",
                  desc: "Easy on the eyes with gorgeous dark mode support built-in.",
                  color: "bg-slate-500/10 text-slate-500 group-hover:bg-slate-500 group-hover:text-slate-50 group-hover:shadow-[0_0_2rem_-0.5rem_#64748b]",
                  glowColor: "bg-slate-500/20",
                  borderColor: "hover:border-slate-500/40 border-border/50",
                  className: "md:col-span-1",
                },
                {
                  icon: Smartphone,
                  title: "PWA Support",
                  desc: "Install on absolutely any device. Works seamlessly offline with auto-sync when connected.",
                  color: "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-orange-50 group-hover:shadow-[0_0_2rem_-0.5rem_#f97316]",
                  glowColor: "bg-orange-500/20",
                  borderColor: "hover:border-orange-500/40 border-border/50",
                  className: "md:col-span-2",
                },
                {
                  icon: ServerIcon,
                  title: "Developer API & Docs",
                  desc: (
                    <>
                      OpenAPI 3.1.0 Specification, API keys, and{" "}
                      <a
                        href="/api/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-indigo-500/30 hover:decoration-indigo-500 transition-colors pointer-events-auto"
                      >
                        Scalar Docs
                      </a>{" "}
                      with <a
                        href="/llms.txt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-indigo-500/30 hover:decoration-indigo-500 transition-colors pointer-events-auto"
                      >
                        llms.txt
                      </a>{" "} support seamlessly integrated.
                    </>
                  ),
                  color: "bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-indigo-50 group-hover:shadow-[0_0_2rem_-0.5rem_#6366f1]",
                  glowColor: "bg-indigo-500/20",
                  borderColor: "hover:border-indigo-500/40 border-border/50",
                  className: "md:col-span-2",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  variants={scaleIn}
                  className={`group relative overflow-hidden rounded-[2rem] border bg-card/40 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${feature.className} ${feature.borderColor}`}
                >
                  {/* Glowing background spot */}
                  <div className={`absolute -right-20 -top-20 h-48 w-48 rounded-full blur-[4rem] transition-all duration-700 group-hover:scale-[2] opacity-40 ${feature.glowColor}`} />

                  {/* Inner Content */}
                  <div className={`relative flex h-full flex-col ${feature.isLarge ? 'justify-end p-8 md:p-10' : 'p-6 md:p-8'}`}>
                    <div className={`mb-4 w-fit rounded-2xl p-4 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 border border-transparent group-hover:border-white/10 ${feature.color}`}>
                      <feature.icon className={`h-8 w-8 transition-transform duration-500 ${feature.isLarge ? 'md:h-12 md:w-12 h-10 w-10' : 'h-8 w-8'}`} strokeWidth={1.5} />
                    </div>

                    <div className={feature.isLarge ? 'mt-16' : 'mt-12'}>
                      <h3 className={`font-semibold tracking-tight mb-3 transition-colors duration-300 group-hover:text-foreground ${feature.isLarge ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>
                        {feature.title}
                      </h3>
                      <div className={`text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80 ${feature.isLarge ? 'text-lg max-w-md leading-relaxed' : 'text-base leading-relaxed'}`}>
                        {feature.desc}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Quotes Carousel Section */}
        <section className="py-24 md:py-32 relative overflow-hidden bg-background">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-amber-500/5 pointer-events-none" />

          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="outline" className="mb-6 px-4 py-1.5 rounded-full border-amber-500/20 bg-amber-500/5 text-amber-500">
                  <BookOpen className="w-4 h-4 mr-2 inline-block" />
                  Islamic Teachings
                </Badge>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                Wisdom on Charity
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Guidance from the Quran and Sunnah about the virtues of giving
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeIn}
            >
              <QuoteCarousel />
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-28 md:py-36 relative overflow-hidden bg-secondary/10">
          <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_0%,black)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[600px] bg-primary/20 rounded-full blur-[100px] opacity-30 pointer-events-none" />

          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="max-w-2xl mx-auto text-center"
            >
              <motion.div variants={scaleIn}>
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 border border-primary/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Logo></Logo>
                </div>
              </motion.div>

              <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-foreground">
                Ready to Track Your Sadaqah?
              </motion.h2>

              <motion.p variants={fadeInUp} className="text-muted-foreground mb-10 text-lg md:text-xl leading-relaxed">
                Start your journey of consistent charitable giving today with elegant tools designed for the modern Muslim.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex justify-center flex-wrap gap-4 relative z-20">
                <CTAButtons />
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
            <p className="text-sm text-muted-foreground">
              Built with{" "}
              <Heart className="inline h-3 w-3" />{" "}
              for the Ummah
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
