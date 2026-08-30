import { useState } from "react";
import { i18n } from "@lingui/core";
import { toLocale } from "@echo/i18n";
import { detectBrowserLocale } from "../i18n";
import {
  createRootRouteWithContext,
  Outlet,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import type { MyRouterContext } from "../router";
import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../lib/trpc";
import { apiUrl } from "../lib/api-url";
import { queryClient } from "../lib/query-client";
import { getSessionQueryOptions } from "@/services/resources/session";
import { useSignOutMutation } from "@/services/resources/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/ui/tooltip";
import type { ClientSession } from "@echo/auth";
import { Landing } from "./-landing";
import { UserMenu } from "@/components/user-menu";
import { isTheme, ThemeProvider } from "@/contexts/theme";
import { SessionProvider } from "@/hooks/use-session";
import { Toaster } from "@/components/ui/toast";
import { DynamicBreadcrumb } from "./-dynamic-breadcrumb";
import { DynamicTitle } from "./-dynamic-title";
import { PageMetaProvider } from "@/contexts/page-meta";

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: () => {
    return {
      prefetchedQueryOptions: {},
    };
  },
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(getSessionQueryOptions());
    i18n.activate(session?.user?.locale ? toLocale(session.user.locale) : detectBrowserLocale());
    return { session };
  },
  staleTime: Infinity,
  component: RootLayout,
});

function RootLayout() {
  const { session } = Route.useLoaderData();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${apiUrl}/trpc`,
          fetch: (url, options) => fetch(url, { ...options, credentials: "include" }),
        }),
      ],
    }),
  );

  const serverTheme =
    session?.user?.theme && isTheme(session.user.theme) ? session.user.theme : undefined;

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider storageKey="vite-ui-theme" serverTheme={serverTheme}>
            <PageMetaProvider>
              <DynamicTitle />
              <RootContent session={session} />
              <Toaster />
            </PageMetaProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function RootContent({ session }: { session: ClientSession | null }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const signOutMutation = useSignOutMutation();

  if (!session) {
    if (pathname === "/reset-password" || pathname === "/accept-invitation") {
      return <Outlet />;
    }
    return <Landing />;
  }

  const handleLogout = () => {
    signOutMutation.mutate(undefined, {
      onSuccess: async () => {
        await router.invalidate();
        router.navigate({ to: "/" });
      },
    });
  };

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
                onLogout={handleLogout}
              />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto typeset typeset-notes">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
