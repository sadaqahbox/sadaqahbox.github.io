import { useState } from "react";
import { boxesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Box } from "@/types";

interface BoxListProps {
  boxes: Box[];
  selectedBoxId?: string;
  onSelectBox: (box: Box) => void;
  onBoxDeleted: (boxId: string) => void;
}

export function BoxList({ boxes, selectedBoxId, onSelectBox, onBoxDeleted }: BoxListProps) {
  const [deletingBox, setDeletingBox] = useState<Box | null>(null);

  const handleDelete = async (box: Box) => {
    try {
      const data = await boxesApi.delete(box.id);
      if (data.success) {
        onBoxDeleted(box.id);
      }
    } catch {
      // Error handled by api.ts
    }
    setDeletingBox(null);
  };

  if (boxes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground text-sm">No boxes yet.</p>
          <p className="text-muted-foreground text-xs">Create one to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-400px)]">
      <div className="space-y-2 pr-4">
        {boxes.map((box) => (
          <Card
            key={box.id}
            className={cn(
              "cursor-pointer transition-colors",
              selectedBoxId === box.id && "border-primary ring-primary/20 ring-1"
            )}
            onClick={() => onSelectBox(box)}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">{box.name}</CardTitle>
                  {box.description && (
                    <CardDescription className="truncate text-xs">
                      {box.description}
                    </CardDescription>
                  )}
                </div>
                <AlertDialog
                  open={deletingBox?.id === box.id}
                  onOpenChange={(open) => !open && setDeletingBox(null)}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingBox(box);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Box?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete &quot;{box.name}&quot; and all its sadaqahs. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeletingBox(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(box)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-muted-foreground flex items-center gap-4 text-xs">
                <span>{box.count} sadaqahs</span>
                <span>
                  {box.totalValue} {box.currency?.symbol || box.currency?.code || ""}
                </span>
              </div>
              {box.tags && box.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {box.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : undefined,
                        color: tag.color || undefined,
                        borderColor: tag.color || undefined,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
