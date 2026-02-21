import { api } from "./client";
import { SuccessResponseSchema } from "./schemas";

export const sadaqahsApi = {
  delete: (boxId: string, sadaqahId: string): Promise<{ success: boolean }> =>
    api.del(`/boxes/${boxId}/sadaqahs/${sadaqahId}`, SuccessResponseSchema),
};
