import type { PlanEntitlements, PlanName } from "./plan.js";

export const planCatalog = {
  free: {
    limits: {
      storageBytes: 1_000_000_000,
      memberSeats: 3,
      maxFileSizeBytes: 50_000_000,
    },
    features: {
      customSlug: false,
      pdfExport: false,
      publicPages: false,
    },
  },
  pro: {
    limits: {
      storageBytes: 50_000_000_000,
      memberSeats: 25,
      maxFileSizeBytes: 500_000_000,
    },
    features: {
      customSlug: true,
      pdfExport: true,
      publicPages: true,
    },
  },
} as const satisfies Record<PlanName, PlanEntitlements>;
