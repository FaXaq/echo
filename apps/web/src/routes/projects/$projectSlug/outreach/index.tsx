import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SuspendedOutreachBoard } from "@/components/features/outreach/suspended-outreach-board";

export const Route = createFileRoute("/projects/$projectSlug/outreach/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { organizationId } = Route.useRouteContext();
  const { projectSlug } = Route.useParams();
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <SuspendedOutreachBoard
        organizationId={organizationId}
        onCardClick={(card) =>
          navigate({
            to: "/projects/$projectSlug/outreach/$cardId",
            params: { projectSlug, cardId: card.id },
          })
        }
      />
    </div>
  );
}
