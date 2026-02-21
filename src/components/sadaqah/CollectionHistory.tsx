import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileDown, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import type { Collection } from "@/types";
import {
  generateSingleCollectionPDF,
  generateAllCollectionsPDF,
  getCurrencyCode,
  formatDateForPDF,
  formatDateShortForPDF,
  type PreferredCurrencyInfo,
} from "@/lib/pdf";
import { authClient } from "@/lib/auth";
import { useCurrencies } from "@/hooks";
import { ListItem } from "@/components/ui/list-item";
import { motion, AnimatePresence } from "motion/react";

interface CollectionHistoryProps {
  collections: Collection[];
  boxName?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function CollectionHistory({ collections, boxName }: CollectionHistoryProps) {
  // Get user's preferred currency
  const { data: session } = authClient.useSession();
  const { data: currencies = [] } = useCurrencies();

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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>("PDF Viewer");

  const handleShowPdf = (pdfDataUrl: string, title: string) => {
    setPdfUrl(pdfDataUrl);
    setPdfTitle(title.replace("Receipt", "Collection"));
  };

  const handleClosePdf = () => {
    setPdfUrl(null);
  };

  if (collections.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No collections yet.</p>
          <p className="text-muted-foreground text-xs">
            Use the "Collect" button to empty this box.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalCollected = collections.reduce((sum, c) => sum + c.totalValue, 0);

  return (
    <>
      <Card>
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {collections.length} collection{collections.length !== 1 ? "s" : ""}
              </p>
              <p className="text-lg font-semibold">
                Total: {totalCollected.toFixed(6).replace(/\.?0+$/, "")}
              </p>
            </div>
            <Button
              onClick={async () => handleShowPdf(await generateAllCollectionsPDF(collections, boxName, preferredCurrency), `${boxName} - All Collections`)}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export All PDF
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-4 pt-0"
          >
            <AnimatePresence mode="popLayout">
              {collections.map((collection, index) => (
                <motion.div key={collection.id} variants={itemVariants} layout>
                  <ListItem
                    icon="logo"
                    title={`${collection.totalValue.toFixed(6).replace(/\.?0+$/, "")} ${getCurrencyCode(collection)}`}
                    subtitle={collection.totalValueExtra && Object.keys(collection.totalValueExtra).length > 0
                      ? `+ ${Object.values(collection.totalValueExtra).reduce((sum, v) => sum + v.total, 0).toFixed(6).replace(/\.?0+$/, "")} extra`
                      : undefined
                    }
                    onClick={async () => handleShowPdf(
                      await generateSingleCollectionPDF(collection, boxName, preferredCurrency),
                      `Collection - ${formatDateShortForPDF(collection.emptiedAt)}`
                    )}
                    action={
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async (e) => {
                          e.stopPropagation();
                          handleShowPdf(
                            await generateSingleCollectionPDF(collection, boxName, preferredCurrency),
                            `Collection - ${formatDateShortForPDF(collection.emptiedAt)}`
                          );
                        }}
                        title="View PDF"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    }
                    extra={
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateForPDF(collection.emptiedAt)}</span>
                      </div>
                    }
                    hoverAnimation={false}
                    className="hover:bg-muted/50 transition-colors"
                  />
                  {index < collections.length - 1 && <Separator />}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </ScrollArea>
      </Card>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!pdfUrl} onOpenChange={(open) => !open && handleClosePdf()}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              {pdfTitle}
            </DialogTitle>
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
                    <FileDown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">PDF could not be displayed</p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(pdfUrl, "_blank")}
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
              onClick={() => pdfUrl && window.open(pdfUrl, "_blank")}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
