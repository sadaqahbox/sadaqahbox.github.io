import { useState, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SadaqahList } from "@/components/sadaqah/SadaqahList";
import { CollectionHistory } from "@/components/sadaqah/CollectionHistory";
import { AddSadaqah } from "@/components/sadaqah/AddSadaqah";
import { Plus, Coins, Gem, Wallet, Info, FileDown } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { GoldIngotsFreeIcons } from "@hugeicons/core-free-icons";
import { generateCollectionReceiptPDF, type PreferredCurrencyInfo } from "@/lib/pdf";
import {
    useSadaqahs,
    useCollections,
    useTags,
    useCurrencies,
    useCreateSadaqah,
    useDeleteSadaqah,
    useEmptyBox,
    useAddTagToBox,
    useRemoveTagFromBox,
    prefetchBox,
} from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { Box, Tag, Collection } from "@/types";
import { authClient } from "@/lib/auth";

interface BoxDetailProps {
  box: Box;
  onBoxUpdated: (box: Box) => void;
}

export function BoxDetail({ box, onBoxUpdated }: BoxDetailProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"sadaqahs" | "collections">("sadaqahs");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>("Collection Receipt");

  // TanStack Query hooks for data fetching
  const { data: sadaqahs = [], isLoading: sadaqahsLoading } = useSadaqahs(box.id);
  const { data: collections = [], isLoading: collectionsLoading } = useCollections(box.id);
  const { data: availableTags = [], isLoading: tagsLoading } = useTags();
  const { data: currencies = [] } = useCurrencies();
  const { data: session } = authClient.useSession();

  // Get user's preferred currency
  const preferredCurrency: PreferredCurrencyInfo | null = useMemo(() => {
    const preferredId = session?.user?.preferredCurrencyId;
    if (!preferredId) return null;
    const currency = currencies.find(c => c.id === preferredId);
    if (!currency) return null;
    return {
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      usdValue: currency.usdValue,
    };
  }, [session?.user?.preferredCurrencyId, currencies]);

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

  const handleCollect = async () => {
    emptyBox(box.id, {
        onSuccess: async (result) => {
            onBoxUpdated(result.box);
            // Generate and show PDF receipt
            if (result.collection) {
                const pdfDataUrl = await generateCollectionReceiptPDF(result.collection, box.name, preferredCurrency);
                setPdfUrl(pdfDataUrl);
                setPdfTitle(`Collection - ${box.name}`);
                setShowPdfDialog(true);
            }
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
    // Use baseCurrency for display since totalValue is stored in base currency
    if (box.baseCurrency) return box.baseCurrency.symbol || box.baseCurrency.code;
    if (box.currency) return box.currency.symbol || box.currency.code;
    return "";
  };

  const getCurrencyIcon = () => {
    // Get currency from baseCurrency or currency
    const currency = box.baseCurrency || box.currency;
    if (!currency) return <Wallet className="h-4 w-4" />;
    

    if (currency.id === "cur_100") {
      return <HugeiconsIcon icon={GoldIngotsFreeIcons} className="h-4 w-4 text-yellow-500"  />
    }
    
    if (currency.currencyTypeId === "ctyp_3") {
      return <Gem className="h-4 w-4 text-green-500" />;
    }
    
    // Check by currencyTypeId for crypto (ctyp_2 is typically Crypto)
    if (currency.currencyTypeId === "ctyp_2") {
      return <Coins className="h-4 w-4 text-blue-500" />;
    }
    
    // Default to wallet for Fiat or unknown types
    return <Wallet className="h-4 w-4 text-muted-foreground" />;
  };

  const getExtraValuesButton = () => {
    if (!box.totalValueExtra || Object.keys(box.totalValueExtra).length === 0) return null;
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-500 dark:hover:bg-amber-950">
            <Info className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-700 dark:text-amber-400">Unconverted Values</DialogTitle>
            <DialogDescription>
              Values that couldn't be converted due to missing exchange rates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {Object.entries(box.totalValueExtra).map(([currencyId, entry]) => (
              <div key={currencyId} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">{entry.code}</p>
                  <p className="text-xs text-muted-foreground">{entry.name}</p>
                </div>
                <p className="font-bold text-amber-700 dark:text-amber-400">{entry.total.toFixed(5)}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
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
            <Card >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{box.count}</div>
                <div className="text-muted-foreground text-xs">Sadaqahs</div>
              </CardContent>
            </Card>
            <Card className="p-0">
              <CardContent className="p-8 text-center relative">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-2xl font-bold">{box.totalValue.toFixed(5)}</div>
                  {getCurrencyIcon()}
                </div>
                <div className="text-muted-foreground text-xs">{getCurrencyDisplay() || "Value"}</div>
                <div className="absolute top-2 right-2">
                  {getExtraValuesButton()}
                </div>
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
              defaultCurrencyId={box.baseCurrencyId || box.currencyId}
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
          <CollectionHistory collections={collections} boxName={box.name} />
        </TabsContent>
      </Tabs>

      {/* PDF Viewer Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              {pdfTitle}
            </DialogTitle>
            <DialogDescription>
              Your collection details
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted rounded-lg overflow-hidden">
            {pdfUrl && (
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <Coins className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">PDF could not be displayed</p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(pdfUrl, '_blank')}
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </object>
            )}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              A5 Portrait • SadaqahBox Collection
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => pdfUrl && window.open(pdfUrl, '_blank')}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
