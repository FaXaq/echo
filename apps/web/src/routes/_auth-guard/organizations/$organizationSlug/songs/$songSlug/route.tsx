import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_auth-guard/organizations/$organizationSlug/songs/$songSlug",
)({
  staticData: { breadcrumb: "Song" },
  component: () => <Outlet />,
});
