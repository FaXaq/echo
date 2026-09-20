import { createFileRoute } from "@tanstack/react-router";
import { SuspendedOutreachBoard } from "@/components/features/outreach/suspended-outreach-board";

export const Route = createFileRoute("/projects/$projectSlug/outreach")({
  staticData: { title: "Outreach", breadcrumb: "Outreach" },
  component: RouteComponent,
});

function RouteComponent() {
  const { organizationId } = Route.useRouteContext();

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <SuspendedOutreachBoard organizationId={organizationId} />
    </div>
  );
}
