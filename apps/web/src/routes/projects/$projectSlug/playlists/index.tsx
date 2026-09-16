import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SuspendedPlaylistList } from "@/components/features/playlist/suspended-playlist-list";

export const Route = createFileRoute("/projects/$projectSlug/playlists/")({
  component: OrganizationPlaylistsPage,
});

function OrganizationPlaylistsPage() {
  const { organizationId } = Route.useRouteContext();
  const { projectSlug } = Route.useParams();
  const navigate = useNavigate();

  return (
    <SuspendedPlaylistList
      organizationId={organizationId}
      projectSlug={projectSlug}
      onPlaylistCreated={(playlist) =>
        navigate({
          to: "/projects/$projectSlug/playlists/$playlistId",
          params: { projectSlug, playlistId: playlist.id },
        })
      }
    />
  );
}
