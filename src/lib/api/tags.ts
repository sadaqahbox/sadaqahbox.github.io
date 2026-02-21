import { api } from "./client";
import type { Tag } from "@/types";

export const tagsApi = {
  getAll: () => api.get<{ success: boolean; tags: Tag[] }>("/tags"),
};
