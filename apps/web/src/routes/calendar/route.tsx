import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/calendar")({
  staticData: { title: "Calendar", breadcrumb: "Calendar" },
  component: () => <Outlet />,
});
