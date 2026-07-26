import type { ServerAuth } from "@echo/auth";

export async function getOrganizationBySlug(
  deps: { auth: ServerAuth; headers: Headers },
  slug: string,
): Promise<{ id: string; name: string } | null> {
  const org = await deps.auth.api.getFullOrganization({
    headers: deps.headers,
    query: { organizationSlug: slug, membersLimit: 0 },
  });
  if (!org) return null;
  return { id: org.id, name: org.name };
}
