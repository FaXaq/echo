import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$projectSlug/expenses")({
  staticData: { title: "Expenses", breadcrumb: "Expenses" },
  component: () => <Outlet />,
});
