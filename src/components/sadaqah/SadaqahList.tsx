import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Clock, Calendar } from "lucide-react";
import type { Currency, Sadaqah } from "@/types";

interface SadaqahListProps {
  sadaqahs: Sadaqah[];
  currency?: Currency;
  onDelete?: (sadaqahId: string) => void;
}

function getCurrencyDisplay(sadaqah: Sadaqah, fallbackCurrency?: Currency) {
  const cur = sadaqah.currency || fallbackCurrency;
  if (!cur) return sadaqah.currencyId;
  return cur.symbol || cur.code;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());

  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (itemDate.getTime() === today.getTime()) return "Today";
  if (itemDate.getTime() === yesterday.getTime()) return "Yesterday";
  if (itemDate >= thisWeekStart) return "This Week";
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) return "This Month";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function groupSadaqahsByDate(sadaqahs: Sadaqah[]): Map<string, Sadaqah[]> {
  const groups = new Map<string, Sadaqah[]>();

  // Sort sadaqahs by date descending (newest first)
  const sorted = [...sadaqahs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const sadaqah of sorted) {
    const group = getDateGroup(sadaqah.createdAt);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(sadaqah);
  }

  return groups;
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

const groupHeaderVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function SadaqahList({ sadaqahs, currency, onDelete }: SadaqahListProps) {
  if (sadaqahs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          >
            <Calendar className="text-muted-foreground h-5 w-5" />
          </motion.div>
          <p className="text-muted-foreground text-sm">No sadaqahs in this box yet.</p>
          <p className="text-muted-foreground text-xs">Add some to get started!</p>
        </CardContent>
      </Card>
    );
  }

  const groupedSadaqahs = groupSadaqahsByDate(sadaqahs);
  const groupEntries = Array.from(groupedSadaqahs.entries());

  return (
    <Card className="overflow-hidden">
      <ScrollArea className="h-[350px]">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-4"
        >
          {groupEntries.map(([group, items], groupIndex) => (
            <motion.div key={group} variants={groupHeaderVariants}>
              <div className="flex items-center gap-2 py-2 first:pt-0">
                <Calendar className="text-primary h-3.5 w-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {group}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {items.length}
                </Badge>
                <Separator className="flex-1" />
              </div>
              <div className="space-y-1 pb-2">
                <AnimatePresence mode="popLayout">
                  {items.map((sadaqah, index) => (
                    <motion.div
                      key={sadaqah.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: 20 }}
                      layout
                      whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
                      className="flex items-center justify-between rounded-md px-2 py-2.5 transition-colors"
                    >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                        <span className="text-primary text-xs font-bold">#{items.length - index}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {sadaqah.value.toLocaleString()} {getCurrencyDisplay(sadaqah, currency)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="text-muted-foreground h-3 w-3" />
                          <span className="text-muted-foreground text-xs">
                            {formatRelativeTime(sadaqah.createdAt)}
                          </span>
                          <span className="text-muted-foreground/50 text-xs">•</span>
                          <span className="text-muted-foreground/70 text-xs">
                            {formatDateTime(sadaqah.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(sadaqah.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
                </div>
              {groupIndex < groupEntries.length - 1 && (
                <Separator className="my-2" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </ScrollArea>
    </Card>
  );
}
