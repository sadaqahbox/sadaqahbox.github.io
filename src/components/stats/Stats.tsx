import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, HandHeart, Wallet } from "lucide-react";

interface StatsProps {
  stats: {
    totalBoxes: number;
    totalSadaqahs: number;
    totalValue: number;
  };
}

export function Stats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Boxes</CardTitle>
          <Package className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBoxes}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Sadaqahs</CardTitle>
          <HandHeart className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSadaqahs}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <Wallet className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
