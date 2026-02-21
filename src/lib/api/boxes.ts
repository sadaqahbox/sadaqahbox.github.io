import { api } from "./client";
import type { Box } from "@/types";

export const boxesApi = {
  getAll: () => api.get<{ success: boolean; boxes: Box[] }>("/boxes"),
  getById: (id: string) => api.get<{ success: boolean; box: Box }>(`/boxes/${id}`),
  create: (data: { name: string; description?: string; tagIds?: string[] }) =>
    api.post<{ success: boolean; box: Box }>("/boxes", data),
  delete: (id: string) => api.del<{ success: boolean }>(`/boxes/${id}`),
  getSadaqahs: (id: string) =>
    api.get<{ success: boolean; sadaqahs: import("@/types").Sadaqah[] }>(`/boxes/${id}/sadaqahs`),
  getCollections: (id: string) =>
    api.get<{ success: boolean; collections: import("@/types").Collection[] }>(`/boxes/${id}/collections`),
  empty: (id: string) =>
    api.post<{ success: boolean; box: Box }>(`/boxes/${id}/empty`),
  addTag: (boxId: string, tagId: string) =>
    api.post<{ success: boolean }>(`/boxes/${boxId}/tags`, { tagId }),
  removeTag: (boxId: string, tagId: string) =>
    api.del<{ success: boolean }>(`/boxes/${boxId}/tags/${tagId}`),
  addSadaqah: (boxId: string, data: { amount: number; value: number; currencyCode: string }) =>
    api.post<{ success: boolean }>(`/boxes/${boxId}/sadaqahs`, data),
};
