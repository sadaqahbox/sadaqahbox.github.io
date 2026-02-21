import { api } from "./client";
import { StatsResponseSchema, type Stats } from "./schemas";

export const statsApi = {
  get: async (): Promise<Stats> => {
    const r = await api.get("/stats", StatsResponseSchema);
    return r.stats;
  },
};

export type { Stats };
