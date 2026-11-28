import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getEventQueryOptions } from "@/services/resources/calendar";
import { useSyncPageMeta } from "@/contexts/page-meta";

export const Route = createFileRoute("/projects/$projectSlug/drive/events/$eventId")({
  staticData: { title: "Event details", breadcrumb: "Event details" },
  component: RouteComponent,
});

function RouteComponent() {
  const { eventId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const pathname = Route.useMatch({ select: (match) => match.pathname });
  const { data: event } = useQuery(getEventQueryOptions({ eventId, organizationId }));
  useSyncPageMeta(pathname, event?.title, event?.title);
  return null;
}
