import { api } from "./client";
import { TagsResponseSchema, type Tag } from "./schemas";

export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    const r = await api.get("/tags", TagsResponseSchema);
    return r.tags;
  },
};

export type { Tag };
