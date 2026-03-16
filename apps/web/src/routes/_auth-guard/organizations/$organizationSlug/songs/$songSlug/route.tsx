import { createFileRoute, Outlet } from "@tanstack/react-router";
import { trpcLoader } from "@/lib/trpc";

export const Route = createFileRoute(
  "/_auth-guard/organizations/$organizationSlug/songs/$songSlug",
)({
  loader: async ({ params }) => {
    const song = await trpcLoader.organization.song.get.query({
      songId: params.songSlug,
    });
    return { breadcrumb: song.name };
  },
  component: () => <Outlet />,
});
