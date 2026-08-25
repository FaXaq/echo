import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/songs")({
  staticData: { title: "Songs", breadcrumb: "Songs" },
  component: () => <Outlet />,
});
