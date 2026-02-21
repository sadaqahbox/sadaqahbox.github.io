import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, HandHeart, Wallet, Coins } from "lucide-react";
import type { PrimaryCurrency } from "@/hooks/useStats";

interface StatsProps {
  stats: {
    totalBoxes: number;
    totalSadaqahs: number;
    totalValue: number;
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
}

function StatCard({ title, value, subtitle, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div variants={cardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <Card className="group overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <motion.div variants={iconVariants} initial="initial" whileHover="hover">
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
      display: value.toFixed(2),
      subtitle: "No base currency set",
    };
  }
  
  // For gold and commodities, show more decimal places
  const isCommodity = ["XAU", "XAG", "XPT", "XPd", "XCU", "XAL", "COCOA"].includes(currency.code);
  const decimals = isCommodity ? 6 : 2;
  
  const symbol = currency.symbol || currency.code;
  
  return {
    display: `${symbol}${value.toFixed(decimals)}`,
    subtitle: `${currency.name}`,
  };
}

export function Stats({ stats }: StatsProps) {
  const { display: valueDisplay, subtitle: valueSubtitle } = formatCurrencyValue(
    stats.totalValue,
    stats.primaryCurrency
  );
  
  // Use Coins icon for gold/commodities, Wallet for fiat
  const ValueIcon = stats.primaryCurrency && ["XAU", "XAG", "XPT", "XPd", "XCU", "XAL", "COCOA"].includes(stats.primaryCurrency.code)
    ? Coins
    : Wallet;
  
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
