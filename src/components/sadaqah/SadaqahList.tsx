import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Currency, Sadaqah } from "@/types";

interface SadaqahListProps {
  sadaqahs: Sadaqah[];
  currency?: Currency;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

function getCurrencyDisplay(sadaqah: Sadaqah, fallbackCurrency?: Currency) {
  const cur = sadaqah.currency || fallbackCurrency;
  if (!cur) return sadaqah.currencyId;
  return cur.symbol || cur.code;
}

export function SadaqahList({ sadaqahs, currency }: SadaqahListProps) {
  if (sadaqahs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No sadaqahs in this box yet.</p>
          <p className="text-muted-foreground text-xs">Add some to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <ScrollArea className="h-[300px]">
        <div className="p-4">
          {sadaqahs.map((sadaqah, index) => (
            <div key={sadaqah.id}>
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {sadaqah.value} {getCurrencyDisplay(sadaqah, currency)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(sadaqah.createdAt)}
                  </span>
                </div>
              </div>
              {index < sadaqahs.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
