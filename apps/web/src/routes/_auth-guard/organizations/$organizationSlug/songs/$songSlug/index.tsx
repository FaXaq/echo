import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { trpcLoader, trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { EditableBadge } from "@/ui/editable-badge";

export const Route = createFileRoute(
  "/_auth-guard/organizations/$organizationSlug/songs/$songSlug/",
)({
  loader: async ({ params }) => {
    const song = await trpcLoader.organization.song.get.query({
      songId: params.songSlug,
    });
    return { song };
  },
  component: SongDetailPage,
});

function SongDetailPage() {
  const { t } = useTranslation("songs");
  const { song } = Route.useLoaderData();
  const { organizationSlug, songSlug } = Route.useParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const updateSong = trpc.organization.song.update.useMutation({
    onSuccess: () => utils.organization.song.get.invalidate({ songId: song.id }),
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{song.name}</h1>
          <div className="flex gap-2 mt-2">
            <EditableBadge
              label={t("BPM")}
              value={song.bpm ?? ""}
              type="number"
              placeholder={t("Add BPM")}
              onSave={(val) => {
                const bpm = parseInt(val, 10);
                if (!isNaN(bpm) && bpm > 0) {
                  updateSong.mutate({ songId: song.id, bpm });
                }
              }}
            />
            <EditableBadge
              label={t("Key")}
              value={song.key ?? ""}
              placeholder={t("Add key")}
              onSave={(val) =>
                updateSong.mutate({ songId: song.id, key: val || null })
              }
            />
          </div>
          {song.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {song.description}
            </p>
          )}
        </div>
        <Button
          onClick={() =>
            navigate({
              to: "/organizations/$organizationSlug/songs/$songSlug/daw",
              params: { organizationSlug, songSlug },
            })
          }
        >
          {t("Open DAW")}
        </Button>
      </div>
    </div>
  );
}
