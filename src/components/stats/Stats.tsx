import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, HandHeart, Wallet, Coins, Gem, AlertCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PrimaryCurrency, TotalValueExtraEntry } from "@/hooks/useStats";
import { formatHighPrecision } from "@/lib/utils";

interface StatsProps {
  stats: {
    totalBoxes: number;
    totalSadaqahs: number;
    totalValue: number;
    totalValueExtra?: Record<string, TotalValueExtraEntry> | null;
    primaryCurrency: PrimaryCurrency | null;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const iconVariants = {
  initial: { rotate: 0, scale: 1 },
  hover: { rotate: 5, scale: 1.1, transition: { duration: 0.2 } },
};

const numberVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  delay?: number;
  extraContent?: React.ReactNode;
}

function StatCard({ title, value, subtitle, icon, delay = 0, extraContent }: StatCardProps) {
  return (
    <motion.div variants={cardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <Card className="group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
         asd <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <motion.div variants={iconVariants} initial="initial" whileHover="hover" className="flex items-center gap-1">
            {extraContent}
            {icon}
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            key={value}
            variants={numberVariants}
            initial="initial"
            animate="animate"
            className="text-2xl font-bold"
          >
            {value}
          </motion.div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Format value with currency
 */
function formatCurrencyValue(value: number, currency: PrimaryCurrency | null): { display: string; subtitle: string } {
  if (!currency) {
    return {
      display: formatHighPrecision(value),
      subtitle: "No base currency set",
    };
  }
  
  // Use high precision (5 decimals) for all currencies including gold prices
  const decimals = 5;
  
  const symbol = currency.symbol || currency.code;
  
  return {
    display: `${symbol}${value.toFixed(decimals)}`,
    subtitle: `${currency.name}`,
  };
}

/**
 * Format extra values for display
 */
function formatExtraValues(extra: Record<string, TotalValueExtraEntry> | null | undefined): string {
  if (!extra || Object.keys(extra).length === 0) {
    return "";
  }
  
  return Object.entries(extra)
    .map(([, entry]) => `${formatHighPrecision(entry.total)} ${entry.code}`)
    .join(", ");
}

/**
 * Extra values dialog component
 */
function ExtraValuesDialog({ extra }: { extra: Record<string, TotalValueExtraEntry> | null | undefined }) {
  if (!extra || Object.keys(extra).length === 0) return null;
  
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
            Values that couldn&apos;t be converted due to missing exchange rates
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {Object.entries(extra).map(([currencyId, entry]) => (
            <div key={currencyId} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50">
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">{entry.code}</p>
                <p className="text-xs text-muted-foreground">{entry.name}</p>
              </div>
              <p className="font-bold text-amber-700 dark:text-amber-400">{formatHighPrecision(entry.total)}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Stats({ stats }: StatsProps) {
  const { display: valueDisplay, subtitle: valueSubtitle } = formatCurrencyValue(
    stats.totalValue,
    stats.primaryCurrency
  );
  
  const hasExtraValues = stats.totalValueExtra && Object.keys(stats.totalValueExtra).length > 0;
  
  // Use Gem icon for gold/commodities, Coins for crypto, Wallet for fiat
  const getValueIcon = () => {
    if (!stats.primaryCurrency) return Wallet;
    
    // Check by currency code directly (commodity codes)
    const code = stats.primaryCurrency.code;
    
    if (["XAU", "XAG", "XPT", "XPd", "XCU", "XAL", "COCOA"].includes(code)) {
      return Gem;
    }
    
    // Check by currencyTypeId for crypto (ctyp_2 is typically Crypto)
    if (stats.primaryCurrency.currencyTypeId === "ctyp_2") {
      return Coins;
    }
    
    // Default to wallet for Fiat or unknown types
    return Wallet;
  };
  
  const ValueIcon = getValueIcon();
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <StatCard
        title="Boxes"
        value={stats.totalBoxes}
        icon={<Package className="text-muted-foreground h-4 w-4" />}
      />
      <StatCard
        title="Sadaqahs"
        value={stats.totalSadaqahs}
        icon={<HandHeart className="text-muted-foreground h-4 w-4" />}
      />
      <StatCard
        title="Total Value"
        value={valueDisplay}
        subtitle={valueSubtitle}
        icon={<ValueIcon className="text-muted-foreground h-4 w-4" />}
      />
    </motion.div>
  );
}
