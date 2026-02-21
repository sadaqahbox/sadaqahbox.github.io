import { api } from "./client";
import {
  BoxesResponseSchema,
  BoxResponseSchema,
  SadaqahsResponseSchema,
  CollectionsResponseSchema,
  EmptyBoxResponseSchema,
  SuccessResponseSchema,
  AddSadaqahResponseSchema,
  CreateBoxBodySchema,
  AddSadaqahBodySchema,
  type Box,
  type Sadaqah,
  type Collection,
  type CreateBoxBody,
  type AddSadaqahBody,
} from "./schemas";

export const boxesApi = {
  getAll: async (): Promise<Box[]> => {
    const r = await api.get("/boxes", BoxesResponseSchema);
    return r.boxes;
  },

  getById: async (id: string): Promise<Box> => {
    const r = await api.get(`/boxes/${id}`, BoxResponseSchema);
    return r.box;
  },

  create: async (data: CreateBoxBody): Promise<Box> => {
    const validated = CreateBoxBodySchema.parse(data);
    const r = await api.post("/boxes", BoxResponseSchema, validated);
    return r.box;
  },

  update: async (id: string, data: Partial<Box>): Promise<Box> => {
    const r = await api.patch(`/boxes/${id}`, BoxResponseSchema, data);
    return r.box;
  },

  delete: (id: string): Promise<{ success: boolean }> =>
    api.del(`/boxes/${id}`, SuccessResponseSchema),

  getSadaqahs: async (id: string): Promise<Sadaqah[]> => {
    const r = await api.get(`/boxes/${id}/sadaqahs`, SadaqahsResponseSchema);
    return r.sadaqahs;
  },

  getCollections: async (id: string): Promise<Collection[]> => {
    const r = await api.get(`/boxes/${id}/collections`, CollectionsResponseSchema);
    return r.collections;
  },

  empty: async (id: string): Promise<{ box: Box; collection: Collection }> => {
    const r = await api.post(`/boxes/${id}/empty`, EmptyBoxResponseSchema);
    return { box: r.box, collection: r.collection };
  },

  addSadaqah: (boxId: string, data: AddSadaqahBody): Promise<{ success: boolean; sadaqahs: Sadaqah[]; box: Box; message: string }> => {
    const validated = AddSadaqahBodySchema.parse(data);
    return api.post(`/boxes/${boxId}/sadaqahs`, AddSadaqahResponseSchema, validated);
  },
};

export type { Box, Sadaqah, Collection, CreateBoxBody, AddSadaqahBody };
