import { api } from "./client";

export const statsApi = {
  get: () => api.get<{ success: boolean; stats: { totalBoxes: number; totalSadaqahs: number; totalValue: number } }>("/stats"),
};
