import { useState, useEffect } from "react";
import { boxesApi, tagsApi } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Box, Tag } from "@/types";

interface CreateBoxProps {
  onCreated: (box: Box) => void;
  onCancel: () => void;
}

export function CreateBox({ onCreated, onCancel }: CreateBoxProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const box = await boxesApi.create({
        name,
        description,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      });
      onCreated(box);
      setName("");
      setDescription("");
      setSelectedTagIds([]);
    } catch {
      // Error handled by api.ts
    } finally {
      setLoading(false);
    }
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
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingTags}>
              <Plus className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Box"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
