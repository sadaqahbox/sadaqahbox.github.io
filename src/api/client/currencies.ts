import { api } from "./client";
import { CurrenciesResponseSchema, type Currency } from "./schemas";

export const currenciesApi = {
  getAll: async (): Promise<Currency[]> => {
    const r = await api.get("/currencies", CurrenciesResponseSchema);
    return r.currencies;
  },
};

export type { Currency };
