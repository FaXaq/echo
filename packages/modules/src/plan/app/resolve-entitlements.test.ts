import { describe, expect, it } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { planCatalog } from "../domain/index.js";
import { resolveEntitlements } from "./resolve-entitlements.js";

const db = makeDbAdapter({
  host: "localhost",
  port: 5432,
  user: "test",
  password: "test",
  name: "test",
}).db;

describe("resolveEntitlements", () => {
  it("returns the catalog entitlements for the resolved plan", async () => {
    const result = await resolveEntitlements(
      { resolvePlanQuery: async () => "pro" },
      { db, scope: createOrganizationScope("org-1") },
    );
    expect(result).toEqual(planCatalog.pro);
  });

  it("passes the db and organization scope to the plan resolver", async () => {
    const seen: string[] = [];
    await resolveEntitlements(
      {
        resolvePlanQuery: async (_db, scope) => {
          seen.push(scope.organizationId);
          return "free";
        },
      },
      { db, scope: createOrganizationScope("org-42") },
    );
    expect(seen).toEqual(["org-42"]);
  });
});
