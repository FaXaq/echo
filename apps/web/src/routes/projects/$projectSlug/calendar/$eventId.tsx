import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SuspendedEventDetail } from "@/components/features/event-calendar/suspended-event-detail";

export const Route = createFileRoute("/projects/$projectSlug/calendar/$eventId")({
  staticData: { title: "Event details", breadcrumb: "Event details" },
  component: OrganizationEventDetailPage,
});

function OrganizationEventDetailPage() {
  const { projectSlug, eventId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const navigate = useNavigate();

  const goBack = () =>
    navigate({
      to: "/projects/$projectSlug/calendar",
      params: { projectSlug },
    });

  return (
    <div className="p-6 h-full">
      <SuspendedEventDetail
        eventId={eventId}
        organizationId={organizationId}
        pathname={`/${projectSlug}/calendar/${eventId}`}
        onBack={goBack}
      />
    </div>
  );
}
