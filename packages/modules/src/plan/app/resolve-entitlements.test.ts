import { describe, expect, it } from "vitest";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { planCatalog } from "../domain/index.js";
import { resolveEntitlements } from "./resolve-entitlements.js";

describe("resolveEntitlements", () => {
  it("returns the catalog entitlements for the resolved plan", async () => {
    const result = await resolveEntitlements(
      { resolvePlan: async () => "pro" },
      createOrganizationScope("org-1"),
    );
    expect(result).toEqual(planCatalog.pro);
  });

  it("passes the organization scope to the plan resolver", async () => {
    const seen: string[] = [];
    await resolveEntitlements(
      {
        resolvePlan: async (scope) => {
          seen.push(scope.organizationId);
          return "free";
        },
      },
      createOrganizationScope("org-42"),
    );
    expect(seen).toEqual(["org-42"]);
  });
});
