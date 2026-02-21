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
import { Coins, FileDown } from "lucide-react";
import { useState } from "react";
import type { Collection } from "@/types";
import {
  generateSingleCollectionPDF,
  generateAllCollectionsPDF,
  getCurrencyCode,
  formatDateForPDF,
  formatDateShortForPDF,
} from "@/lib/pdf";

interface CollectionHistoryProps {
  collections: Collection[];
  boxName?: string;
}

export function CollectionHistory({ collections, boxName }: CollectionHistoryProps) {
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
                Total: {totalCollected.toFixed(6).replace(/\.?0+$/, '')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShowPdf(generateAllCollectionsPDF(collections, boxName), `${boxName} - All Collections`)}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export All PDF
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-4 pt-0">
            {collections.map((collection, index) => (
              <div key={collection.id}>
                <div className="flex items-center gap-4 py-3">
                  <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <Coins className="text-primary h-5 w-5" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {collection.totalValue.toFixed(6).replace(/\.?0+$/, '')} {getCurrencyCode(collection)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDateForPDF(collection.emptiedAt)}
                      </span>
                    </div>
                    {collection.totalValueExtra && Object.keys(collection.totalValueExtra).length > 0 && (
                      <span className="text-muted-foreground text-xs">
                        + {Object.values(collection.totalValueExtra).reduce((sum, v) => sum + v.total, 0).toFixed(6).replace(/\.?0+$/, '')} extra
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleShowPdf(generateSingleCollectionPDF(collection, boxName), `Collection - ${formatDateShortForPDF(collection.emptiedAt)}`)}
                    title="View PDF"
                    className="h-8 w-8 shrink-0"
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
                {index < collections.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!pdfUrl} onOpenChange={(open) => !open && handleClosePdf()}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
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
    </>
  );
}
