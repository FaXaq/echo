import { getFullOrganizationQueryOptions } from "@/services/resources/organization";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/")({
  beforeLoad: async ({ params, context }) => {
    const organization = await context.queryClient.ensureQueryData(
      getFullOrganizationQueryOptions({ organizationId: context.organizationId }),
    );
    return {
      organization,
    };
  },
  component: () => <RouteComponent />,
});

function RouteComponent() {
  const { organization } = Route.useRouteContext();
  return (
    <div>
      <h1>{organization.name}</h1>
    </div>
  );
}
