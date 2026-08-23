import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SuspendedSongList } from "@/components/features/song/suspended-song-list";

export const Route = createFileRoute("/projects/$projectSlug/songs/")({
  component: OrganizationSongsPage,
});

function OrganizationSongsPage() {
  const { organizationId } = Route.useRouteContext();
  const { projectSlug } = Route.useParams();
  const navigate = useNavigate();

  return (
    <SuspendedSongList
      organizationId={organizationId}
      projectSlug={projectSlug}
      onSongCreated={(song) =>
        navigate({
          to: "/projects/$projectSlug/songs/$songId",
          params: { projectSlug, songId: song.id },
        })
      }
    />
  );
}
