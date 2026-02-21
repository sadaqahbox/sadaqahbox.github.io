import { api } from "./client";
import { DeleteSadaqahResponseSchema } from "./schemas";
import type { Box } from "./schemas";

export interface DeleteSadaqahResult {
  success: boolean;
  deleted: boolean;
  updatedBox?: Box;
}

export const sadaqahsApi = {
  delete: (boxId: string, sadaqahId: string): Promise<DeleteSadaqahResult> =>
    api.del(`/boxes/${boxId}/sadaqahs/${sadaqahId}`, DeleteSadaqahResponseSchema),
};
