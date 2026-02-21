import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header, Logo } from "@/components/layout";
import { SignedIn, SignedOut } from "@daveyplate/better-auth-ui";
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
} from "lucide-react";
import quotesData from "@/data/quotes.json";

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
                    className={`p-3 rounded-full mb-5 ${
                      currentQuote.type === "ayah"
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
          {allQuotes.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
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

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ y: [0, -30, 0], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ y: [0, 25, 0], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-3xl"
            />
          </div>

          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col items-center text-center max-w-3xl mx-auto"
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="secondary" className="mb-5 px-3 py-1">
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Track Your Charity Journey
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5"
              >
                Track Your{" "}
                <span className="text-primary relative">
                  Sadaqah
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3"
                    viewBox="0 0 200 12"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <motion.path
                      d="M2 8C50 2 150 2 198 8"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="text-primary/30"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-base sm:text-lg text-muted-foreground mb-7 max-w-lg leading-relaxed"
              >
                A modern way to manage your charity boxes
                and track your charitable giving.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3">
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
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Why Sadaqah Box Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/20">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-12"
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="outline" className="mb-4">
                  <Gift className="w-3 h-3 mr-1" />
                  Our Purpose
                </Badge>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl font-bold mb-3">
                Why Sadaqah Box?
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base"
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
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              <motion.div variants={scaleIn}>
                <Card className="h-full bg-gradient-to-br from-primary/5 to-background border-primary/10">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Daily Reminder</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The Prophet ﷺ taught us that every joint of our body requires
                      sadaqah each day the sun rises. Drop your contribution in a
                      virtual box daily—we'll hold it safely until you're ready to give.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={scaleIn}>
                <Card className="h-full bg-gradient-to-br from-amber-500/5 to-background border-amber-500/10">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                      <Wallet className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Accumulate & Give</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Whether it's a few coins or a larger amount, set aside sadaqah
                      daily in your boxes. When the time is right, collect and distribute
                      to those in need—all at once or box by box.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={scaleIn}>
                <Card className="h-full bg-gradient-to-br from-emerald-500/5 to-background border-emerald-500/10">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Fulfill Your Promise</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      When you add sadaqah to a box, you're making a commitment to give.
                      We help you track what you've set aside so you can fulfill that
                      promise and ensure your charity actually reaches those in need.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-10 text-center"
            >
              <p className="text-sm text-muted-foreground italic max-w-xl mx-auto">
                "There is a sadaqah to be given for every joint of the human body
                every day the sun rises." — Sahih al-Bukhari 2989
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 md:py-28 bg-muted/20">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-12"
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="outline" className="mb-4">
                  Features
                </Badge>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl font-bold mb-3">
                Everything You Need
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base"
              >
                Simple tools to help you stay consistent with your charitable giving
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: Package,
                  title: "Multiple Boxes",
                  desc: "Create separate boxes for different causes, family members, or charities.",
                  color: "from-emerald-500/5 to-background",
                  borderColor: "border-emerald-500/10",
                  iconColor: "text-emerald-600",
                  bgColor: "bg-emerald-500/10",
                },
                {
                  icon: Globe,
                  title: "Multi-Currency",
                  desc: "Track donations in any currency. Fiat, crypto, and commodities supported.",
                  color: "from-blue-500/5 to-background",
                  borderColor: "border-blue-500/10",
                  iconColor: "text-blue-600",
                  bgColor: "bg-blue-500/10",
                },
                {
                  icon: Wallet,
                  title: "Easy Tracking",
                  desc: "Quickly add sadaqah entries with automatic value calculations.",
                  color: "from-amber-500/5 to-background",
                  borderColor: "border-amber-500/10",
                  iconColor: "text-amber-600",
                  bgColor: "bg-amber-500/10",
                },
                {
                  icon: History,
                  title: "Collection History",
                  desc: "View complete history when you empty your boxes. Track over time.",
                  color: "from-violet-500/5 to-background",
                  borderColor: "border-violet-500/10",
                  iconColor: "text-violet-600",
                  bgColor: "bg-violet-500/10",
                },
                {
                  icon: FileText,
                  title: "PDF Reports",
                  desc: "Generate beautiful PDF receipts for your collections with full details.",
                  color: "from-rose-500/5 to-background",
                  borderColor: "border-rose-500/10",
                  iconColor: "text-rose-600",
                  bgColor: "bg-rose-500/10",
                },
                {
                  icon: TrendingUp,
                  title: "Statistics",
                  desc: "See your total giving, box counts, and sadaqah statistics at a glance.",
                  color: "from-cyan-500/5 to-background",
                  borderColor: "border-cyan-500/10",
                  iconColor: "text-cyan-600",
                  bgColor: "bg-cyan-500/10",
                },
                {
                  icon: Moon,
                  title: "Dark Mode",
                  desc: "Easy on the eyes with full dark mode support throughout the app.",
                  color: "from-slate-500/5 to-background",
                  borderColor: "border-slate-500/10",
                  iconColor: "text-slate-600",
                  bgColor: "bg-slate-500/10",
                },
                {
                  icon: Smartphone,
                  title: "PWA Support",
                  desc: "Install on any device. Works offline with sync when connected.",
                  color: "from-orange-500/5 to-background",
                  borderColor: "border-orange-500/10",
                  iconColor: "text-orange-600",
                  bgColor: "bg-orange-500/10",
                },
              ].map((feature, i) => (
                <motion.div key={i} variants={scaleIn}>
                  <Card className={`h-full bg-gradient-to-br ${feature.color} ${feature.borderColor} border`}>
                    <CardContent className="p-6 text-center">
                      <div className={`w-12 h-12 rounded-full ${feature.bgColor} flex items-center justify-center mx-auto mb-4`}>
                        <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Quotes Carousel Section */}
        <section className="py-20 md:py-28">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-10"
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="outline" className="mb-4">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Islamic Teachings
                </Badge>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl font-bold mb-3">
                Wisdom on Charity
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
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
        <section className="py-20 md:py-28 bg-muted/20">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="max-w-xl mx-auto text-center"
            >
              <motion.div variants={scaleIn}>
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Logo></Logo>
                </div>
              </motion.div>

              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl font-bold mb-3">
                Ready to Track Your Sadaqah?
              </motion.h2>

              <motion.p variants={fadeInUp} className="text-muted-foreground mb-6 text-sm sm:text-base">
                Start your journey of consistent charitable giving today.
              </motion.p>

              <motion.div variants={fadeInUp}>
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
