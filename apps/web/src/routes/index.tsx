import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionQueryOptions } from "@/services/resources/session";
import { selfListOrganizations } from "@/services/resources/organization";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(getSessionQueryOptions());
    if (!session) return;

    const organizations = await context.queryClient.ensureQueryData(selfListOrganizations());
    const personalOrganization = organizations.find((o) => o.isPersonal);
    if (!personalOrganization) throw redirect({ to: "/projects/new" });
    throw redirect({
      to: "/projects/$projectSlug/calendar",
      params: { projectSlug: personalOrganization.slug },
    });
  },
});
