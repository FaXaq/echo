import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { z } from "zod";
import { DriveExplorer } from "@/components/features/drive/drive-explorer";
import { driveSortFieldSchema, driveSortOrderSchema } from "@/services/resources/drive";

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

  return (
    <div className="flex h-full min-h-0 flex-col p-6">
      <div className="mb-5">
        <h1 className="text-3xl font-bold mb-2">
          <Trans>Drive</Trans>
        </h1>
        <p className="text-muted-foreground">
          <Trans>All files shared across the project</Trans>
        </p>
      </div>
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
