import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout";
import { Stats } from "@/components/stats";
import { BoxList, BoxDetail, CreateBox } from "@/components/boxes";
import { boxesApi, statsApi } from "@/lib/api";
import type { Box } from "@/types";
import { SignedIn, SignedOut, RedirectToSignIn, AuthLoading } from "@daveyplate/better-auth-ui";

export function Dashboard() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({ totalBoxes: 0, totalSadaqahs: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchBoxes = async () => {
    try {
      const data = await boxesApi.getAll();
      if (data.success) {
        setBoxes(data.boxes);
      }
    } catch {
      // Error handled by api.ts
    }
  };

  const fetchStats = async () => {
    try {
      const data = await statsApi.get();
      if (data.success) {
        setStats(data.stats);
      }
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
        <header className="border-b px-6 py-4">
          <Skeleton className="h-8 w-48" />
        </header>
        <main className="flex-1 p-6">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <Stats stats={stats} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Your Boxes</h2>
                    <Button onClick={() => setShowCreateForm(true)}>
                      + New Box
                    </Button>
                  </div>

                  {showCreateForm && (
                    <CreateBox onCreated={handleBoxCreated} onCancel={() => setShowCreateForm(false)} />
                  )}

                  <BoxList
                    boxes={boxes}
                    selectedBoxId={selectedBox?.id}
                    onSelectBox={setSelectedBox}
                    onBoxDeleted={handleBoxDeleted}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedBox ? (
                <BoxDetail box={selectedBox} onBoxUpdated={handleBoxUpdated} />
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <span className="text-2xl">🕌</span>
                    </div>
                    <h3 className="text-lg font-medium">Select a box to view details</h3>
                    <p className="text-muted-foreground mt-1 text-sm">or create a new box to get started</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    </div>
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
