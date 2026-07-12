import type { ServerAuth } from "@echo/auth";
import type { OrganizationRepoPort } from "./organization-repository.port.js";

export const makeOrganizationRepo = ({
  auth,
  headers,
}: {
  auth: ServerAuth;
  headers: Headers;
}): OrganizationRepoPort => ({
  get: async ({ slug }) => {
    const org = await auth.api.getFullOrganization({
      headers,
      query: { organizationSlug: slug, membersLimit: 0 },
    });
    if (!org) return null;
    return { id: org.id, name: org.name };
  },
});
