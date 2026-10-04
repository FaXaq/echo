import { describe, expect, it } from "vitest";
import { APIError } from "better-auth/api";
import { makeOrganizationCurrencyHooks } from "./organization-currency-hooks";

const member = { organizationId: "org-1" };

describe("makeOrganizationCurrencyHooks.beforeUpdateOrganization", () => {
  it("ignores updates that do not touch the currency", async () => {
    const seen: string[] = [];
    const hooks = makeOrganizationCurrencyHooks(async (organizationId) => {
      seen.push(organizationId);
      return "locked";
    });

    await expect(
      hooks.beforeUpdateOrganization({ organization: { name: "New name" }, member }),
    ).resolves.toBeUndefined();
    expect(seen).toEqual([]);
  });

  it("passes the organization and requested currency to the validator", async () => {
    const seen: [string, string][] = [];
    const hooks = makeOrganizationCurrencyHooks(async (organizationId, currency) => {
      seen.push([organizationId, currency]);
      return "ok";
    });

    await hooks.beforeUpdateOrganization({ organization: { currency: "USD" }, member });

    expect(seen).toEqual([["org-1", "USD"]]);
  });

  it("rejects an unsupported currency as a bad request", async () => {
    const hooks = makeOrganizationCurrencyHooks(async () => "unsupported");

    await expect(
      hooks.beforeUpdateOrganization({ organization: { currency: "XXXX" }, member }),
    ).rejects.toMatchObject({ status: "BAD_REQUEST" });
  });

  it("rejects a currency change once the ledger has entries", async () => {
    const hooks = makeOrganizationCurrencyHooks(async () => "locked");

    await expect(
      hooks.beforeUpdateOrganization({ organization: { currency: "USD" }, member }),
    ).rejects.toBeInstanceOf(APIError);
  });

  it("rejects a null currency without consulting the validator", async () => {
    const seen: string[] = [];
    const hooks = makeOrganizationCurrencyHooks(async (organizationId) => {
      seen.push(organizationId);
      return "ok";
    });

    await expect(
      hooks.beforeUpdateOrganization({ organization: { currency: null }, member }),
    ).rejects.toMatchObject({ status: "BAD_REQUEST" });
    expect(seen).toEqual([]);
  });
});

describe("makeOrganizationCurrencyHooks.beforeCreateOrganization", () => {
  const hooks = makeOrganizationCurrencyHooks(async () => "ok");

  it("rejects an unsupported currency as a bad request", async () => {
    await expect(
      hooks.beforeCreateOrganization({ organization: { currency: "XXXX" } }),
    ).rejects.toMatchObject({ status: "BAD_REQUEST" });
  });

  it("rejects a null currency as a bad request", async () => {
    await expect(
      hooks.beforeCreateOrganization({ organization: { currency: null } }),
    ).rejects.toMatchObject({ status: "BAD_REQUEST" });
  });

  it("accepts a supported or absent currency", async () => {
    await expect(
      hooks.beforeCreateOrganization({ organization: { currency: "USD" } }),
    ).resolves.toBeUndefined();
    await expect(
      hooks.beforeCreateOrganization({ organization: { name: "Band" } }),
    ).resolves.toBeUndefined();
  });
});
