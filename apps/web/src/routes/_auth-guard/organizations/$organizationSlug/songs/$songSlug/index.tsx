import { createFileRoute } from "@tanstack/react-router";
import { trpcLoader } from "@/lib/trpc";
import { Daw } from "./-daw";

export const Route = createFileRoute(
  "/_auth-guard/organizations/$organizationSlug/songs/$songSlug/",
)({
  staticData: { breadcrumb: "Song" },
  loader: async ({ params }) => {
    const [song, tracks, clips] = await Promise.all([
      trpcLoader.organization.song.get.query({ songId: params.songSlug }),
      trpcLoader.organization.track.list.query({ songId: params.songSlug }),
      trpcLoader.organization.audioClip.listBySong.query({
        songId: params.songSlug,
      }),
    ]);
    return { song, tracks, clips };
  },
  component: SongDetailPage,
});

function SongDetailPage() {
  const { song, tracks, clips } = Route.useLoaderData();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{song.name}</h1>
        {song.key && (
          <p className="text-muted-foreground mt-1">Key: {song.key}</p>
        )}
      </div>
      <Daw song={song} initialTracks={tracks} initialClips={clips} />
    </div>
  );
}
