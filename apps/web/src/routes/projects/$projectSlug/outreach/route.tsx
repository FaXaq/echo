import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/outreach")({
  staticData: { title: "Outreach", breadcrumb: "Outreach" },
  component: () => <Outlet />,
});
