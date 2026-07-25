import { useEffect, useState } from "react";
import i18next from "../i18n";
import {
  createRootRouteWithContext,
  Outlet,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import type { MyRouterContext } from "../router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../lib/trpc";
import { authClient } from "../lib/auth";
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/ui/tooltip";
import type { ClientSession } from "@echo/auth";
import { Landing } from "./-landing";
import { UserMenu } from "@/components/user-menu";
import { ThemeProvider } from "@/contexts/theme";
import { SessionProvider } from "@/hooks/use-session";
import { DynamicBreadcrumb } from "./-dynamic-breadcrumb";


export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: async () => {
    const { data: session } = await authClient.getSession();
    return { session };
  },
  staleTime: Infinity,
  component: RootLayout,
});

function RootLayout() {
  const { session } = Route.useLoaderData();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: "/trpc" })],
    }),
  );

  useEffect(() => {
    if (session?.user.locale) {
      i18next.changeLanguage(session.user.locale);
    }
  }, [session?.user.locale]);

  const serverTheme = session?.user.theme as "light" | "dark" | "system" | undefined;

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider storageKey="vite-ui-theme" serverTheme={serverTheme}>
            <RootContent session={session} />
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function RootContent({ session }: { session: ClientSession | null }) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  if (!session) {
    if (pathname === "/reset-password" || pathname === "/accept-invitation") {
      return <Outlet />
    }
    return <Landing />
  }

  const handleLogout = async () => {
    await authClient.signOut()
    router.invalidate()
  }

  return (
    <SessionProvider session={session}>
      <SidebarProvider className="overflow-x-clip">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-full"
            />
            <DynamicBreadcrumb />
            <div className="ml-auto">
              <UserMenu
                name={session.user.name}
                username={session.user.username ?? ""}
                email={session.user.email}
                image={session.user.image}
                onLogout={handleLogout}
              />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}
