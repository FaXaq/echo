import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DriveExplorer } from "@/components/features/drive/drive-explorer";
import { driveSortFieldSchema, driveSortOrderSchema } from "@/services/resources/drive";
import { useQuery } from "@tanstack/react-query";
import { getEventQueryOptions } from "@/services/resources/calendar";
import { useSyncPageMeta } from "@/contexts/page-meta";

export const Route = createFileRoute("/projects/$projectSlug/drive/events/$eventId")({
  validateSearch: z.object({
    sort: driveSortFieldSchema.optional().catch(undefined),
    order: driveSortOrderSchema.optional().catch(undefined),
  }),
  staticData: { title: "Event details", breadcrumb: "Event details" },
  component: RouteComponent,
});

function RouteComponent() {
  const { projectSlug, eventId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const sort = search.sort ?? "name";
  const order = search.order ?? "asc";
  const pathname = Route.useMatch({ select: (match) => match.pathname });
  const { data: event } = useQuery(getEventQueryOptions({ eventId, organizationId }));
  useSyncPageMeta(pathname, event?.title, event?.title);

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <DriveExplorer
        organizationId={organizationId}
        projectSlug={projectSlug}
        location={{ kind: "event", id: eventId }}
        sort={sort}
        order={order}
        onSortChange={(field) =>
          navigate({
            from: Route.fullPath,
            search: (prev) => ({
              ...prev,
              sort: field,
              order: prev.sort === field && prev.order === "asc" ? "desc" : "asc",
            }),
          })
        }
      />
    </div>
  );
}
