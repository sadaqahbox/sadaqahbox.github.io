import { useState, useEffect } from "react";
import { boxesApi, tagsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SadaqahList } from "@/components/sadaqah/SadaqahList";
import { CollectionHistory } from "@/components/sadaqah/CollectionHistory";
import { AddSadaqah } from "@/components/sadaqah/AddSadaqah";
import { Plus, Coins, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Box, Sadaqah, Collection, Tag } from "@/types";

interface BoxDetailProps {
  box: Box;
  onBoxUpdated: (box: Box) => void;
}

export function BoxDetail({ box, onBoxUpdated }: BoxDetailProps) {
  const [sadaqahs, setSadaqahs] = useState<Sadaqah[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeTab, setActiveTab] = useState<"sadaqahs" | "collections">("sadaqahs");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  const fetchSadaqahs = async () => {
    try {
      const data = await boxesApi.getSadaqahs(box.id);
      if (data.success) {
        setSadaqahs(data.sadaqahs);
      }
    } catch {
      // Error handled by api.ts
    }
  };

  const fetchCollections = async () => {
    try {
      const data = await boxesApi.getCollections(box.id);
      if (data.success) {
        setCollections(data.collections);
      }
    } catch {
      // Error handled by api.ts
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const data = await tagsApi.getAll();
      if (data.success) {
        setAvailableTags(data.tags);
      }
    } catch {
      // Error handled by api.ts
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSadaqahs(), fetchCollections(), fetchAvailableTags()]);
      setLoading(false);
    };
    loadData();
  }, [box.id]);

  const handleSadaqahAdded = async () => {
    await fetchSadaqahs();
    try {
      const data = await boxesApi.getById(box.id);
      if (data.success) {
        onBoxUpdated(data.box);
      }
    } catch {
      // Error handled by api.ts
    }
    setShowAddForm(false);
  };

  const handleCollect = async () => {
    try {
      const data = await boxesApi.empty(box.id);
      if (data.success) {
        onBoxUpdated(data.box);
        await fetchSadaqahs();
        await fetchCollections();
      }
    } catch {
      // Error handled by api.ts
    }
  };

  const handleAddTag = async (tagId: string) => {
    try {
      const data = await boxesApi.addTag(box.id, tagId);
      if (data.success) {
        const boxData = await boxesApi.getById(box.id);
        if (boxData.success) {
          onBoxUpdated(boxData.box);
        }
      }
    } catch {
      // Error handled by api.ts
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const data = await boxesApi.removeTag(box.id, tagId);
      if (data.success) {
        const boxData = await boxesApi.getById(box.id);
        if (boxData.success) {
          onBoxUpdated(boxData.box);
        }
      }
    } catch {
      // Error handled by api.ts
    }
  };

  const getCurrencyDisplay = () => {
    if (!box.currency) return "";
    return box.currency.symbol || box.currency.code;
  };

  const unassignedTags = availableTags.filter((tag) => !box.tags?.some((t) => t.id === tag.id));

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{box.name}</CardTitle>
              {box.description && (
                <CardDescription className="mt-1">{box.description}</CardDescription>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {box.tags?.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}30` : undefined,
                      color: tag.color || undefined,
                      borderColor: tag.color || undefined,
                    }}
                  >
                    {tag.name}
                    <button
                      className="hover:bg-background/50 ml-1 rounded-full px-1 text-xs"
                      onClick={() => handleRemoveTag(tag.id)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {unassignedTags.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 text-xs">
                        + Add Tag
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {unassignedTags.map((tag) => (
                        <DropdownMenuItem
                          key={tag.id}
                          onClick={() => handleAddTag(tag.id)}
                          className="gap-2"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: tag.color || "#6366f1" }}
                          />
                          {tag.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {box.count > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="secondary">
                      <Coins className="mr-2 h-4 w-4" />
                      Collect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Collect Sadaqahs?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will collect all {box.count} sadaqahs from &quot;{box.name}&quot;.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCollect}>Collect</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="mr-2 h-4 w-4" />
                {showAddForm ? "Cancel" : "Add Sadaqah"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{box.count}</div>
                <div className="text-muted-foreground text-xs">Sadaqahs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{box.totalValue}</div>
                <div className="text-muted-foreground text-xs">{getCurrencyDisplay() || "Value"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{collections.length}</div>
                <div className="text-muted-foreground text-xs">Collections</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {showAddForm && (
        <AddSadaqah boxId={box.id} onAdded={handleSadaqahAdded} onCancel={() => setShowAddForm(false)} />
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "sadaqahs" | "collections")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sadaqahs">Sadaqahs ({sadaqahs.length})</TabsTrigger>
          <TabsTrigger value="collections">Collections ({collections.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="sadaqahs" className="mt-4">
          <SadaqahList sadaqahs={sadaqahs} currency={box.currency} />
        </TabsContent>
        <TabsContent value="collections" className="mt-4">
          <CollectionHistory collections={collections} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
