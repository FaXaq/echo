import { describe, expect, it } from "vitest";
import { planCatalog } from "./catalog.js";
import { exceedsLimit } from "./limit.js";
import { planNameSchema } from "./plan.js";

describe("planCatalog", () => {
  it("defines entitlements for every plan name", () => {
    for (const name of planNameSchema.options) {
      expect(planCatalog[name]).toBeDefined();
    }
  });

  it("gives pro strictly higher limits than free", () => {
    expect(planCatalog.pro.limits.storageBytes).toBeGreaterThan(
      planCatalog.free.limits.storageBytes,
    );
    expect(planCatalog.pro.limits.memberSeats).toBeGreaterThan(planCatalog.free.limits.memberSeats);
    expect(planCatalog.pro.limits.maxFileSizeBytes).toBeGreaterThan(
      planCatalog.free.limits.maxFileSizeBytes,
    );
  });

  it("disables every feature on free", () => {
    expect(Object.values(planCatalog.free.features).every((enabled) => !enabled)).toBe(true);
  });
});

describe("exceedsLimit", () => {
  it("allows usage that lands exactly on the limit", () => {
    expect(exceedsLimit({ current: 900, delta: 100, limit: 1000 })).toBe(false);
  });

  it("rejects usage one byte over the limit", () => {
    expect(exceedsLimit({ current: 900, delta: 101, limit: 1000 })).toBe(true);
  });

  it("rejects when already over the limit and adding nothing", () => {
    expect(exceedsLimit({ current: 1001, delta: 0, limit: 1000 })).toBe(true);
  });
});
