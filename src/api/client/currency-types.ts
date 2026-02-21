import { api } from "./client";
import { z } from "zod";

const CurrencyTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

const CurrencyTypesResponseSchema = z.object({
  success: z.boolean(),
  currencyTypes: CurrencyTypeSchema.array(),
});

export interface CurrencyType {
  id: string;
  name: string;
  description?: string;
}

export const currencyTypesApi = {
  getAll: async (): Promise<CurrencyType[]> => {
    const r = await api.get("/currency-types", CurrencyTypesResponseSchema);
    return r.currencyTypes;
  },
};

export type { CurrencyType };
