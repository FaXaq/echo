import type { ServerAuth } from "@echo/auth";
import type { Organization } from "../domain/index.js";

export type { Organization };

export interface OrganizationRepoPort {
  get: (input: { slug: string }) => Promise<{ id: string; name: string } | null>;
}

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
