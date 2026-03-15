import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { trpcLoader } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";

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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{song.name}</h1>
          <div className="flex gap-4 mt-1 text-muted-foreground text-sm">
            {song.key && (
              <span>
                {t("Key")}: {song.key}
              </span>
            )}
            {song.bpm && (
              <span>
                {t("BPM")}: {song.bpm}
              </span>
            )}
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
