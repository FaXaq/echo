import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DriveExplorer } from "@/components/features/drive/drive-explorer";
import { driveSortFieldSchema, driveSortOrderSchema } from "@/services/resources/drive";
import { useQuery } from "@tanstack/react-query";
import { getSongQueryOptions } from "@/services/resources/song";
import { useSyncPageMeta } from "@/contexts/page-meta";

export const Route = createFileRoute("/projects/$projectSlug/drive/songs/$songId")({
  validateSearch: z.object({
    sort: driveSortFieldSchema.optional().catch(undefined),
    order: driveSortOrderSchema.optional().catch(undefined),
  }),
  staticData: { title: "Song details", breadcrumb: "Song details" },
  component: RouteComponent,
});

function RouteComponent() {
  const { projectSlug, songId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const sort = search.sort ?? "name";
  const order = search.order ?? "asc";
  const pathname = Route.useMatch({ select: (match) => match.pathname });
  const { data: song } = useQuery(getSongQueryOptions({ songId, organizationId }));
  useSyncPageMeta(pathname, song?.title, song?.title);

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <DriveExplorer
        organizationId={organizationId}
        projectSlug={projectSlug}
        location={{ kind: "song", id: songId }}
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
