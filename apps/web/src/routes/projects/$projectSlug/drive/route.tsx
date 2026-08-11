import { createFileRoute } from "@tanstack/react-router";
import { useLingui } from "@lingui/react/macro";
import { SuspendedDriveFiles } from "@/components/features/drive/suspended-drive-files";

export const Route = createFileRoute("/projects/$projectSlug/drive")({
  staticData: { title: "Drive", breadcrumb: "Drive" },
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useLingui();
  const { organizationId } = Route.useRouteContext();

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-5">
        <h1 className="text-3xl font-bold mb-2">{t`Drive`}</h1>
        <p className="text-muted-foreground">{t`All files shared across the project`}</p>
      </div>
      <SuspendedDriveFiles organizationId={organizationId} />
    </div>
  );
}
