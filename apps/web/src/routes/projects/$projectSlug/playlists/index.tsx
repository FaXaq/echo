import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SuspendedPlaylistList } from "@/components/features/playlist/suspended-playlist-list";

export const Route = createFileRoute("/projects/$projectSlug/playlists/")({
  validateSearch: z.object({ create: z.boolean().optional().catch(undefined) }),
  component: OrganizationPlaylistsPage,
});

function OrganizationPlaylistsPage() {
  const { organizationId } = Route.useRouteContext();
  const { projectSlug } = Route.useParams();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [startCreating] = useState(search.create === true);

  useEffect(() => {
    if (startCreating) navigate({ from: Route.fullPath, search: {}, replace: true });
  }, [startCreating, navigate]);

  return (
    <SuspendedPlaylistList
      startCreating={startCreating}
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
