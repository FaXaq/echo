import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth";
import { selfListOrganizations } from "@/services/resources/organization";
import { Outlet } from "@tanstack/react-router";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug")({
  beforeLoad: async ({ params, context }) => {
    const organizations = await context.queryClient.ensureQueryData(selfListOrganizations());
    const org = organizations.find((o) => o.slug === params.projectSlug);
    if (!org) throw redirect({ to: "/" });
    await authClient.organization.setActive({ organizationId: org.id });
    return { organizationId: org.id };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = useSession();

  if (!session) {
    throw redirect({ to: "/" });
  }

  return <Outlet />;
}
