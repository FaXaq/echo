import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { Trans } from "@lingui/react/macro";
import { z } from "zod";
import { DriveExplorer } from "@/components/features/drive/drive-explorer";
import { SuspendedDriveQuotaBar } from "@/components/features/drive/suspended-drive-quota-bar";
import { driveSortFieldSchema, driveSortOrderSchema } from "@/services/resources/drive";

export const Route = createFileRoute("/projects/$projectSlug/drive/")({
  validateSearch: z.object({
    sort: driveSortFieldSchema.optional().catch(undefined),
    order: driveSortOrderSchema.optional().catch(undefined),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { projectSlug } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const sort = search.sort ?? "name";
  const order = search.order ?? "asc";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-5 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <Trans>Drive</Trans>
          </h1>
          <p className="text-muted-foreground">
            <Trans>All files shared across the project</Trans>
          </p>
        </div>
        <div className="w-56 shrink-0 pt-1">
          <SuspendedDriveQuotaBar organizationId={organizationId} />
        </div>
      </div>
      <DriveExplorer
        organizationId={organizationId}
        projectSlug={projectSlug}
        folderId={null}
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
