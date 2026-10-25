import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SuspendedSongDetail } from "@/components/features/song/suspended-song-detail";
import { SongUploadProvider } from "@/components/features/song/song-upload-context";
import { SongDropZone } from "./-song-drop-zone";

export const Route = createFileRoute("/projects/$projectSlug/songs/$songId")({
  staticData: { title: "Song details", breadcrumb: "Song details" },
  component: OrganizationSongDetailPage,
});

function OrganizationSongDetailPage() {
  const { projectSlug, songId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const pathname = Route.useMatch({ select: (match) => match.pathname });
  const navigate = useNavigate();

  const goBack = () => navigate({ to: "/projects/$projectSlug/songs", params: { projectSlug } });

  return (
    <SongUploadProvider>
      <SongDropZone songId={songId} organizationId={organizationId}>
        <SuspendedSongDetail
          key={songId}
          songId={songId}
          organizationId={organizationId}
          pathname={pathname}
          onBack={goBack}
        />
      </SongDropZone>
    </SongUploadProvider>
  );
}
