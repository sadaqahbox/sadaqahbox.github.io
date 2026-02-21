import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
    useSadaqahs,
    useCollections,
    useTags,
    useCreateSadaqah,
    useDeleteSadaqah,
    useEmptyBox,
    useAddTagToBox,
    useRemoveTagFromBox,
    prefetchBox,
} from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { Box, Tag } from "@/types";

interface BoxDetailProps {
  box: Box;
  onBoxUpdated: (box: Box) => void;
}

export function BoxDetail({ box, onBoxUpdated }: BoxDetailProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"sadaqahs" | "collections">("sadaqahs");
  const [showAddForm, setShowAddForm] = useState(false);

  // TanStack Query hooks for data fetching
  const { data: sadaqahs = [], isLoading: sadaqahsLoading } = useSadaqahs(box.id);
  const { data: collections = [], isLoading: collectionsLoading } = useCollections(box.id);
  const { data: availableTags = [], isLoading: tagsLoading } = useTags();

  // Mutations
  const { mutate: createSadaqah, isPending: isCreatingSadaqah } = useCreateSadaqah();
  const { mutate: deleteSadaqah, isPending: isDeletingSadaqah } = useDeleteSadaqah();
  const { mutate: emptyBox, isPending: isEmptying } = useEmptyBox();
  const { mutate: addTag, isPending: isAddingTag } = useAddTagToBox();
  const { mutate: removeTag, isPending: isRemovingTag } = useRemoveTagFromBox();

  const isLoading = sadaqahsLoading || collectionsLoading || tagsLoading;

  const handleSadaqahAdded = (value: number, currencyId?: string) => {
    createSadaqah(
        { boxId: box.id, value, currencyId },
        {
            onSuccess: (result) => {
                if (result.box) {
                    onBoxUpdated(result.box);
                }
                // Keep the form open for adding more sadaqahs
            },
        }
    );
  };

  const handleDeleteSadaqah = (sadaqahId: string) => {
    deleteSadaqah(
        { boxId: box.id, sadaqahId },
        {
            onSuccess: (result) => {
                if (result.updatedBox) {
                    onBoxUpdated(result.updatedBox as Box);
                }
            },
        }
    );
  };

  const handleCollect = () => {
    emptyBox(box.id, {
        onSuccess: (result) => {
            onBoxUpdated(result);
        },
    });
  };

  const handleAddTag = (tagId: string) => {
    addTag(
        { boxId: box.id, tagId },
        {
            onSuccess: async () => {
                // Prefetch updated box data
                await prefetchBox(queryClient, box.id);
            },
        }
    );
  };

  const handleRemoveTag = (tagId: string) => {
    removeTag(
        { boxId: box.id, tagId },
        {
            onSuccess: async () => {
                // Prefetch updated box data
                await prefetchBox(queryClient, box.id);
            },
        }
    );
  };

  const getCurrencyDisplay = () => {
    if (!box.currency) return "";
    return box.currency.symbol || box.currency.code;
  };

  const unassignedTags = availableTags.filter((tag: Tag) => !box.tags?.some((t) => t.id === tag.id));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
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
                <AnimatePresence mode="popLayout">
                  {box.tags?.map((tag) => (
                    <motion.div
                      key={tag.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      layout
                    >
                      <Badge
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
                          className="hover:bg-background/50 ml-1 rounded-full px-1 text-xs disabled:opacity-50"
                          onClick={() => handleRemoveTag(tag.id)}
                          disabled={isRemovingTag}
                        >
                          ×
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {unassignedTags.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs disabled:opacity-50"
                        disabled={isAddingTag}
                      >
                        + Add Tag
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {unassignedTags.map((tag: Tag) => (
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
                    <Button variant="secondary" disabled={isEmptying}>
                      <Coins className="mr-2 h-4 w-4" />
                      {isEmptying ? "Collecting..." : "Collect"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Collect Sadaqahs?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will collect all {box.count} sadaqahs from "{box.name}".
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

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AddSadaqah
              boxId={box.id}
              onAdded={handleSadaqahAdded}
              onCancel={() => setShowAddForm(false)}
              isLoading={isCreatingSadaqah}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "sadaqahs" | "collections")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sadaqahs">
            Sadaqahs ({sadaqahs.length})
          </TabsTrigger>
          <TabsTrigger value="collections">
            Collections ({collections.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sadaqahs" className="mt-4">
          <SadaqahList
            sadaqahs={sadaqahs}
            currency={box.currency}
            onDelete={handleDeleteSadaqah}
            isDeleting={isDeletingSadaqah}
          />
        </TabsContent>
        <TabsContent value="collections" className="mt-4">
          <CollectionHistory collections={collections} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
