import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) return;

    const { data: organizations } = await authClient.organization.list();
    const personalOrganization = organizations?.find((o) => o.isPersonal);
    if (!personalOrganization) throw redirect({ to: "/organizations/new" });
    throw redirect({
      to: "/organizations/$organizationSlug/calendar",
      params: { organizationSlug: personalOrganization.slug },
    });
  },
});
