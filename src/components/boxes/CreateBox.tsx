import { useState, useEffect } from "react";
import { tagsApi } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Box, Tag } from "@/types";
import type { CreateBoxBody } from "@/api/client";

interface CreateBoxProps {
  onCreated: (box: Box) => void;
  onCancel: () => void;
  createBox?: (data: CreateBoxBody) => void;
  isCreating?: boolean;
}

export function CreateBox({ onCreated, onCancel, createBox, isCreating = false }: CreateBoxProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [fetchingTags, setFetchingTags] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await tagsApi.getAll();
        setAvailableTags(tags);
      } catch {
        // Error handled by api.ts
      } finally {
        setFetchingTags(false);
      }
    };
    fetchTags();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (createBox) {
      // Use the mutation from props
      createBox({
        name,
        description,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      });
    }
    
    // Clear form
    setName("");
    setDescription("");
    setSelectedTagIds([]);
    onCreated({} as Box); // Let parent handle the actual box from mutation
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Create New Box</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="box-name">Name *</FieldLabel>
            <Input
              id="box-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ramadan Charity"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="box-description">Description</FieldLabel>
            <Textarea
              id="box-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </Field>

          {availableTags.length > 0 && (
            <Field>
              <FieldLabel>Tags</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected && "text-primary-foreground"
                      )}
                      style={
                        isSelected
                          ? {
                              backgroundColor: tag.color || undefined,
                              borderColor: tag.color || undefined,
                            }
                          : {
                              borderColor: tag.color || undefined,
                              color: tag.color || undefined,
                            }
                      }
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            </Field>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isCreating}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || fetchingTags || !name.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? "Creating..." : "Create Box"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
