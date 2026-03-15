import { useSession } from '@/hooks/use-session';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth-guard')({
  component: RouteComponent,
})

function RouteComponent() {
  const { session } = useSession();

  if (!session) {
    throw redirect({ to: "/" })
  }

  return <Outlet />
}
