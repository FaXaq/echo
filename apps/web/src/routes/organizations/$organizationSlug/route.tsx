import { authClient } from '@/lib/auth'
import { Outlet } from '@tanstack/react-router';
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/organizations/$organizationSlug')({
  beforeLoad: async ({ params }) => {
    const { data: organizations } = await authClient.organization.list();
    const org = organizations?.find((o) => o.slug === params.organizationSlug);
    if (!org) throw redirect({ to: "/" });
    await authClient.organization.setActive({ organizationId: org.id });
    return { organizationId: org.id };
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
