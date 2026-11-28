import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getSongQueryOptions } from "@/services/resources/song";
import { useSyncPageMeta } from "@/contexts/page-meta";

export const Route = createFileRoute("/projects/$projectSlug/drive/songs/$songId")({
  staticData: { title: "Song details", breadcrumb: "Song details" },
  component: RouteComponent,
});

function RouteComponent() {
  const { songId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const pathname = Route.useMatch({ select: (match) => match.pathname });
  const { data: song } = useQuery(getSongQueryOptions({ songId, organizationId }));
  useSyncPageMeta(pathname, song?.title, song?.title);
  return null;
}
