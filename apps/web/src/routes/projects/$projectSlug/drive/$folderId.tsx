import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getFolderQueryOptions } from "@/services/resources/drive";
import { useSyncPageMeta } from "@/contexts/page-meta";

export const Route = createFileRoute("/projects/$projectSlug/drive/$folderId")({
  staticData: { title: "Drive", breadcrumb: "Drive" },
  component: RouteComponent,
});

function RouteComponent() {
  const { folderId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const pathname = Route.useMatch({ select: (match) => match.pathname });
  const { data: folder } = useQuery(getFolderQueryOptions({ id: folderId, organizationId }));
  useSyncPageMeta(pathname, folder?.name, folder?.name);
  return null;
}
