import { createFileRoute } from "@tanstack/react-router";
import { trpcLoader } from "@/lib/trpc";
import { useTranslation, Trans } from "react-i18next";
import { Daw } from "../-daw";

export const Route = createFileRoute(
  "/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/",
)({
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
  component: DawPage,
});

function DawPage() {
  const { t } = useTranslation("songs");
  const { song, tracks, clips } = Route.useLoaderData();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{song.name}</h1>
        <div className="flex gap-4 mt-1 text-muted-foreground text-sm">
          {song.key && (
            <span>
              <Trans t={t}>Key</Trans>: {song.key}
            </span>
          )}
          {song.bpm && (
            <span>
              <Trans t={t}>BPM</Trans>: {song.bpm}
            </span>
          )}
        </div>
      </div>
      <Daw song={song} initialTracks={tracks} initialClips={clips} />
    </div>
  );
}
