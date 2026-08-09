import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/organizations/$organizationSlug/calendar")({
  staticData: { title: "Calendar", breadcrumb: "Calendar" },
  component: () => <Outlet />,
});
