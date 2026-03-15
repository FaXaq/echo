import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { trpcLoader } from "@/lib/trpc";
import { Button } from "@/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/ui/sheet";
import { SongsTable } from "./-songs-table";
import { CreateSongForm } from "./-create-song-form";

export const Route = createFileRoute(
  "/_auth-guard/organizations/$organizationSlug/songs/",
)({
  loader: async ({ params }) => {
    const songs = await trpcLoader.organization.song.list.query({
      organizationSlug: params.organizationSlug,
    });
    return { songs };
  },
  component: SongsPage,
});

function SongsPage() {
  const { t } = useTranslation("songs");
  const { organizationSlug } = Route.useParams();
  const { songs } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCreateSuccess = () => {
    setIsSheetOpen(false);
    navigate({ search: (prev) => prev });
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("Songs")}</h1>
          <p className="text-muted-foreground">
            {t("Add a new song to your project")}
          </p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button>{t("New song")}</Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>{t("New song")}</SheetTitle>
              <SheetDescription>
                {t("Add a new song to your project")}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-auto px-6">
              <CreateSongForm
                organizationSlug={organizationSlug}
                onSuccess={handleCreateSuccess}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <SongsTable
        songs={songs}
        organizationSlug={organizationSlug}
        onRefresh={() => navigate({ search: (prev) => prev })}
      />
    </div>
  );
}
