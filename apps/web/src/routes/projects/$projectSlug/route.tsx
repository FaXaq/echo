import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { selfListOrganizations } from "@/services/resources/organization";
import { getSessionQueryOptions } from "@/services/resources/session";
import { AppSidebar } from "@/components/app-sidebar";
import { AudioPlayerDockContainer } from "@/components/features/audio-player/audio-player-dock-container";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/user-menu";
import { SessionProvider } from "@/hooks/use-session";
import { DynamicBreadcrumb } from "@/routes/-dynamic-breadcrumb";

export const Route = createFileRoute("/projects/$projectSlug")({
  beforeLoad: async ({ params, context, location }) => {
    const session = await context.queryClient.ensureQueryData(getSessionQueryOptions());
    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }

    const organizations = await context.queryClient.ensureQueryData(selfListOrganizations());
    const org = organizations.find((o) => o.slug === params.projectSlug);
    if (!org) throw redirect({ to: "/" });
    return { organizationId: org.id, session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = Route.useRouteContext();

  return (
    <SessionProvider session={session}>
      <SidebarProvider className="overflow-x-clip">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-full" />
            <DynamicBreadcrumb />
            <div className="ml-auto">
              <UserMenu
                name={session.user.name}
                username={session.user.username ?? ""}
                email={session.user.email}
                image={session.user.image}
              />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto typeset typeset-notes">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      <AudioPlayerDockContainer />
    </SessionProvider>
  );
}
