import type { PlanEntitlements, PlanName } from "./plan.js";

export const planCatalog = {
  free: {
    limits: {
      storageBytes: 100_000_000_000,
      memberSeats: 4,
      maxFileSizeBytes: 5_000_000_000,
    },
    features: {
      customSlug: false,
      pdfExport: false,
      publicPages: false,
    },
  },
  pro: {
    limits: {
      storageBytes: 200_000_000_000,
      memberSeats: 25,
      // ponytail: 5 GiB = S3 single-PUT max; raising this needs multipart upload
      maxFileSizeBytes: 5_368_709_120,
    },
    features: {
      customSlug: true,
      pdfExport: true,
      publicPages: true,
    },
  },
} as const satisfies Record<PlanName, PlanEntitlements>;
