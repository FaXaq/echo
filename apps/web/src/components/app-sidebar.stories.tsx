import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { selfListOrganizations } from "@/services/resources/organization";
import { getActiveMemberRoleQueryOptions } from "@/services/resources/session";

function withRouter(children: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const projectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/projects/$projectSlug",
    component: () => children,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([projectRoute]),
    history: createMemoryHistory({ initialEntries: ["/projects/acme-inc"] }),
  });
  return <RouterProvider router={router} />;
}

function withSeededQueryClient() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(selfListOrganizations().queryKey, [
    { id: "org-1", name: "Acme Inc", slug: "acme-inc", isPersonal: false },
    { id: "org-2", name: "Jane Doe", slug: "jane-doe", isPersonal: true },
  ]);
  queryClient.setQueryData(getActiveMemberRoleQueryOptions({ organizationId: "org-1" }).queryKey, {
    role: "owner",
  });
  return queryClient;
}

const meta = {
  title: "Components/AppSidebar",
  component: AppSidebar,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededQueryClient()}>
        {withRouter(
          <SidebarProvider>
            <Story />
          </SidebarProvider>,
        )}
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof AppSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
