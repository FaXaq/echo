import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SuspendedSongDetail } from "@/components/features/song/suspended-song-detail";

export const Route = createFileRoute("/projects/$projectSlug/songs/$songId")({
  staticData: { title: "Song details", breadcrumb: "Song details" },
  component: OrganizationSongDetailPage,
});

function OrganizationSongDetailPage() {
  const { projectSlug, songId } = Route.useParams();
  const { organizationId } = Route.useRouteContext();
  const navigate = useNavigate();

  const goBack = () => navigate({ to: "/projects/$projectSlug/songs", params: { projectSlug } });

  return (
    <div className="p-6 h-full">
      <SuspendedSongDetail
        songId={songId}
        organizationId={organizationId}
        pathname={`/${projectSlug}/songs/${songId}`}
        onBack={goBack}
      />
    </div>
  );
}
