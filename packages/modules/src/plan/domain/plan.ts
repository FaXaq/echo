import { z } from "zod";

export const planNameSchema = z.enum(["free", "pro"]);
export type PlanName = z.infer<typeof planNameSchema>;

export type PlanLimits = {
  storageBytes: number;
  memberSeats: number;
  maxFileSizeBytes: number;
};

export type PlanFeatures = {
  customSlug: boolean;
  pdfExport: boolean;
  publicPages: boolean;
};

export type PlanEntitlements = {
  limits: PlanLimits;
  features: PlanFeatures;
};

export type LimitName = keyof PlanLimits;
