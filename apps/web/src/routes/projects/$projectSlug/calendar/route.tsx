import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/calendar")({
  staticData: { title: "Calendar", breadcrumb: "Calendar" },
  component: () => <Outlet />,
});
