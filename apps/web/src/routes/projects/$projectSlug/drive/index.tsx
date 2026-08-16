import { SuspendedDriveFiles } from "@/components/features/drive/suspended-drive-files";
import { SuspendedDriveQuotaBar } from "@/components/features/drive/suspended-drive-quota-bar";
import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/drive/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { organizationId } = Route.useRouteContext();

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
      <SuspendedDriveFiles organizationId={organizationId} />
    </div>
  );
}
