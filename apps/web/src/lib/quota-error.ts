import { z } from "zod";

const quotaErrorSchema = z.object({
  data: z.object({
    quota: z.object({
      limitName: z.string(),
      limit: z.number(),
      current: z.number(),
    }),
  }),
});

export function getQuotaError(error: unknown) {
  const parsed = quotaErrorSchema.safeParse(error);
  return parsed.success ? parsed.data.data.quota : null;
}
