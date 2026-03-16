import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { trpcLoader, trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { EditableBadge } from "@/ui/editable-badge";
import { Daw } from "../-daw";

export const Route = createFileRoute(
  "/_auth-guard/organizations/$organizationSlug/songs/$songSlug/daw/",
)({
  loader: async ({ params }) => {
    const [song, tracks, clips, midiClips] = await Promise.all([
      trpcLoader.organization.song.get.query({ songId: params.songSlug }),
      trpcLoader.organization.track.list.query({ songId: params.songSlug }),
      trpcLoader.organization.audioClip.listBySong.query({
        songId: params.songSlug,
      }),
      trpcLoader.organization.midiClip.listBySong.query({
        songId: params.songSlug,
      }),
    ]);
    return { song, tracks, clips, midiClips };
  },
  component: DawPage,
});

const DEFAULT_BPM = 120;

function DawPage() {
  const { t } = useTranslation("songs");
  const { song, tracks, clips, midiClips } = Route.useLoaderData();
  const [bpm, setBpm] = useState(song.bpm ?? DEFAULT_BPM);
  const [key, setKey] = useState(song.key ?? "");

  const updateSong = trpc.organization.song.update.useMutation();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{song.name}</h1>
        <div className="flex gap-2 mt-2">
          <EditableBadge
            label={t("BPM")}
            value={bpm}
            type="number"
            placeholder={t("Add BPM")}
            onSave={(val) => {
              const parsed = parseInt(val, 10);
              if (!isNaN(parsed) && parsed > 0) {
                setBpm(parsed);
                updateSong.mutate({ songId: song.id, bpm: parsed });
              }
            }}
          />
          <EditableBadge
            label={t("Key")}
            value={key}
            placeholder={t("Add key")}
            onSave={(val) => {
              setKey(val);
              updateSong.mutate({ songId: song.id, key: val || null });
            }}
          />
        </div>
      </div>
      <Daw song={song} initialTracks={tracks} initialClips={clips} initialMidiClips={midiClips} bpm={bpm} />
    </div>
  );
}
