import auth from "./auth/auth";
import type { OrganizationRepoPort } from "@echo/app/ports";

export const makeOrganizationRepo = ({
  headers,
}: {
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
