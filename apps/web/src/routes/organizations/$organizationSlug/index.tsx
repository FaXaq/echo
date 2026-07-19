import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/organizations/$organizationSlug/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/organization/organizationSlug/"!</div>
}
