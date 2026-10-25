import { useQuery } from "@tanstack/react-query";
import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DriveExplorer } from "@/components/features/drive/drive-explorer";
import {
  driveSortFieldSchema,
  driveSortOrderSchema,
  getFolderQueryOptions,
} from "@/services/resources/drive";
import { useSyncPageMeta } from "@/contexts/page-meta";

export const Route = createFileRoute("/projects/$projectSlug/drive/$folderId")({
  validateSearch: z.object({
    sort: driveSortFieldSchema.optional().catch(undefined),
    order: driveSortOrderSchema.optional().catch(undefined),
  }),
  staticData: { title: "Drive", breadcrumb: "Drive" },
  component: RouteComponent,
});

function RouteComponent() {
  const { projectSlug, folderId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const sort = search.sort ?? "name";
  const order = search.order ?? "asc";
  const pathname = Route.useMatch({ select: (match) => match.pathname });
  const { data: folder } = useQuery(getFolderQueryOptions({ id: folderId, organizationId }));
  useSyncPageMeta(pathname, folder?.name, folder?.name);

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <DriveExplorer
        organizationId={organizationId}
        projectSlug={projectSlug}
        folderId={folderId}
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
