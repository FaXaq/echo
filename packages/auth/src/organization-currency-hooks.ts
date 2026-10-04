import { APIError } from "better-auth/api";
import type { ServerAuthConfig } from "./server";

export const makeOrganizationCurrencyHooks = (
  validate: ServerAuthConfig["validateOrganizationCurrencyChange"],
) => ({
  beforeUpdateOrganization: async ({
    organization,
    member,
  }: {
    organization: Record<string, unknown>;
    member: { organizationId: string };
  }) => {
    if (typeof organization.currency !== "string") return;

    const verdict = await validate?.(member.organizationId, organization.currency);
    if (verdict === "unsupported") {
      throw new APIError("BAD_REQUEST", { message: "Unsupported currency." });
    }
    if (verdict === "locked") {
      throw new APIError("FORBIDDEN", {
        message: "The currency cannot change once the organization has expenses.",
      });
    }
  },
});
