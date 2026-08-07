import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SuspendedEventDetail } from "@/components/features/event-calendar/suspended-event-detail";

export const Route = createFileRoute("/calendar/$eventId")({
  staticData: { breadcrumb: "Event details" },
  component: EventDetailPage,
});

function EventDetailPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <SuspendedEventDetail eventId={eventId} onBack={() => navigate({ to: "/calendar" })} />
    </div>
  );
}
