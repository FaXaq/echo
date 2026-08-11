import { describe, expect, it } from "vitest";
import { planCatalog } from "../domain/index.js";
import { resolveEntitlements } from "./resolve-entitlements.js";

describe("resolveEntitlements", () => {
  it("returns the catalog entitlements for the resolved plan", async () => {
    const result = await resolveEntitlements({ resolvePlan: async () => "pro" }, "org-1");
    expect(result).toEqual(planCatalog.pro);
  });

  it("passes the organization id to the plan resolver", async () => {
    const seen: string[] = [];
    await resolveEntitlements(
      {
        resolvePlan: async (organizationId) => {
          seen.push(organizationId);
          return "free";
        },
      },
      "org-42",
    );
    expect(seen).toEqual(["org-42"]);
  });
});
