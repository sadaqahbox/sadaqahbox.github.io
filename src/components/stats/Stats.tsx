import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, HandHeart, Wallet } from "lucide-react";

interface StatsProps {
  stats: {
    totalBoxes: number;
    totalSadaqahs: number;
    totalValue: number;
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
  icon: React.ReactNode;
  delay?: number;
}

function StatCard({ title, value, icon, delay = 0 }: StatCardProps) {
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
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Stats({ stats }: StatsProps) {
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
        value={`$${stats.totalValue.toFixed(2)}`}
        icon={<Wallet className="text-muted-foreground h-4 w-4" />}
      />
    </motion.div>
  );
}
