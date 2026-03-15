import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_auth-guard/organizations/$organizationSlug/songs',
)({
  staticData: { breadcrumb: "Songs" },
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
