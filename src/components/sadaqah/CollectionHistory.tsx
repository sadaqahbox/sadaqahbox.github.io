import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Coins } from "lucide-react";
import type { Collection } from "@/types";

interface CollectionHistoryProps {
  collections: Collection[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

function getCurrencyDisplay(collection: Collection) {
  if (!collection.currency) return collection.currencyId;
  return collection.currency.symbol || collection.currency.code;
}

export function CollectionHistory({ collections }: CollectionHistoryProps) {
  if (collections.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No collections yet.</p>
          <p className="text-muted-foreground text-xs">
            Use the &quot;Collect&quot; button to empty this box.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <ScrollArea className="h-[300px]">
        <div className="p-4">
          {collections.map((collection, index) => (
            <div key={collection.id}>
              <div className="flex items-center gap-4 py-3">
                <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <Coins className="text-primary h-5 w-5" />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {collection.totalValue} {getCurrencyDisplay(collection)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(collection.emptiedAt)}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {collection.sadaqahsCollected} sadaqahs collected
                  </span>
                </div>
              </div>
              {index < collections.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
