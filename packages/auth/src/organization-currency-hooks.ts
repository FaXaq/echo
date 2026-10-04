import { APIError } from "better-auth/api";
import type { ServerAuthConfig } from "./server";

const unsupportedCurrency = () => new APIError("BAD_REQUEST", { message: "Unsupported currency." });

export const makeOrganizationCurrencyHooks = (
  validate: ServerAuthConfig["validateOrganizationCurrencyChange"],
) => ({
  beforeCreateOrganization: async ({ organization }: { organization: Record<string, unknown> }) => {
    if (organization.currency === undefined) return;
    if (
      typeof organization.currency !== "string" ||
      !Intl.supportedValuesOf("currency").includes(organization.currency)
    ) {
      throw unsupportedCurrency();
    }
  },

  beforeUpdateOrganization: async ({
    organization,
    member,
  }: {
    organization: Record<string, unknown>;
    member: { organizationId: string };
  }) => {
    if (organization.currency === undefined) return;
    if (typeof organization.currency !== "string") throw unsupportedCurrency();

    const verdict = await validate?.(member.organizationId, organization.currency);
    if (verdict === "unsupported") throw unsupportedCurrency();
    if (verdict === "locked") {
      throw new APIError("FORBIDDEN", {
        message: "The currency cannot change once the organization has expenses.",
      });
    }
  },
});
