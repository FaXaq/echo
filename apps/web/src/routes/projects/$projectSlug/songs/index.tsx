import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SuspendedSongList } from "@/components/features/song/suspended-song-list";

export const Route = createFileRoute("/projects/$projectSlug/songs/")({
  validateSearch: z.object({ create: z.boolean().optional().catch(undefined) }),
  component: OrganizationSongsPage,
});

function OrganizationSongsPage() {
  const { organizationId } = Route.useRouteContext();
  const { projectSlug } = Route.useParams();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [startCreating] = useState(search.create === true);

  useEffect(() => {
    if (startCreating) navigate({ from: Route.fullPath, search: {}, replace: true });
  }, [startCreating, navigate]);

  return (
    <SuspendedSongList
      startCreating={startCreating}
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
