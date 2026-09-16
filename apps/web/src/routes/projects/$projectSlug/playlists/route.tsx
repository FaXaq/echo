import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/playlists")({
  staticData: { title: "Playlists", breadcrumb: "Playlists" },
  component: () => <Outlet />,
});
