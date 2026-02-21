import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout";
import { Stats } from "@/components/stats";
import { BoxList, BoxDetail, CreateBox } from "@/components/boxes";
import { boxesApi, statsApi } from "@/api/client";
import type { Box } from "@/types";
import { SignedIn, SignedOut, RedirectToSignIn, AuthLoading } from "@daveyplate/better-auth-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mosque01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { PackageOpen } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const sidebarVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const mainContentVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      delay: 0.1,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const iconContainerVariants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

export function Dashboard() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({ totalBoxes: 0, totalSadaqahs: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchBoxes = async () => {
    try {
      const boxes = await boxesApi.getAll();
      setBoxes(boxes);
    } catch {
      // Error handled by api.ts
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await statsApi.get();
      setStats(stats);
    } catch {
      // Error handled by api.ts
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBoxes(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleBoxCreated = (box: Box) => {
    setBoxes((prev) => [box, ...prev]);
    setShowCreateForm(false);
    fetchStats();
  };

  const handleBoxDeleted = (boxId: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== boxId));
    if (selectedBox?.id === boxId) {
      setSelectedBox(null);
    }
    fetchStats();
  };

  const handleBoxUpdated = (updatedBox: Box) => {
    setBoxes((prev) => prev.map((b) => (b.id === updatedBox.id ? updatedBox : b)));
    if (selectedBox?.id === updatedBox.id) {
      setSelectedBox(updatedBox);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="bg-muted h-28 rounded-lg" />
                </motion.div>
              ))}
            </motion.div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-muted h-[calc(100vh-300px)] rounded-lg"
              />
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-muted h-[calc(100vh-300px)] rounded-lg lg:col-span-2"
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-7xl space-y-6"
        >
          {/* Stats Section */}
          <motion.div variants={itemVariants}>
            <Stats stats={stats} />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Sidebar - Box List */}
            <motion.div
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-4 xl:col-span-3"
            >
              <Card className="h-full overflow-hidden">
                <CardHeader className="pb-4">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        whileHover={{ rotate: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <HugeiconsIcon icon={Mosque01Icon} className="text-primary size-5" />
                      </motion.div>
                      <CardTitle className="text-lg">Your Boxes</CardTitle>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    >
                      <Button
                        size="sm"
                        onClick={() => setShowCreateForm(true)}
                        className="gap-1"
                      >
                        <HugeiconsIcon icon={Add01Icon} className="size-4" />
                        New
                      </Button>
                    </motion.div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <CardDescription>
                      {boxes.length} {boxes.length === 1 ? "box" : "boxes"} total
                    </CardDescription>
                  </motion.div>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  <AnimatePresence mode="wait">
                    {showCreateForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 border-b"
                      >
                        <CreateBox
                          onCreated={handleBoxCreated}
                          onCancel={() => setShowCreateForm(false)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <BoxList
                    boxes={boxes}
                    selectedBoxId={selectedBox?.id}
                    onSelectBox={setSelectedBox}
                    onBoxDeleted={handleBoxDeleted}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content - Box Detail */}
            <motion.div
              variants={mainContentVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-8 xl:col-span-9"
            >
              <AnimatePresence mode="wait">
                {selectedBox ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BoxDetail box={selectedBox} onBoxUpdated={handleBoxUpdated} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    variants={emptyStateVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  >
                    <Card className="border-dashed h-full min-h-[400px]">
                      <CardContent className="flex flex-col items-center justify-center h-full py-16 text-center">
                        <motion.div
                          variants={iconContainerVariants}
                          initial="initial"
                          animate="animate"
                          className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                        >
                          <PackageOpen className="text-primary size-10" />
                        </motion.div>
                        <motion.h3
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-xl font-semibold mb-2"
                        >
                          Select a box to view details
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-muted-foreground max-w-sm"
                        >
                          Choose a box from the sidebar to view its sadaqahs, collections, and manage tags.
                          Or create a new box to get started.
                        </motion.p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-screen items-center justify-center"
    >
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" as const }}
          >
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm"
          >
            Loading...
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ProtectedDashboard() {
  return (
    <>
      <AuthLoading>
        <LoadingFallback />
      </AuthLoading>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <Dashboard />
      </SignedIn>
    </>
  );
}
