import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SuspendedPlaylistDetail } from "@/components/features/playlist/suspended-playlist-detail";

export const Route = createFileRoute("/projects/$projectSlug/playlists/$playlistId")({
  staticData: { title: "Playlist details", breadcrumb: "Playlist details" },
  component: OrganizationPlaylistDetailPage,
});

function OrganizationPlaylistDetailPage() {
  const { projectSlug, playlistId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const navigate = useNavigate();

  const goBack = () =>
    navigate({ to: "/projects/$projectSlug/playlists", params: { projectSlug } });

  return (
    <div className="p-6 h-full">
      <SuspendedPlaylistDetail
        key={playlistId}
        playlistId={playlistId}
        organizationId={organizationId}
        projectSlug={projectSlug}
        pathname={`/${projectSlug}/playlists/${playlistId}`}
        onBack={goBack}
      />
    </div>
  );
}
