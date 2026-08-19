import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { SuspendedOrganizationSettings } from "./suspended-organization-settings";
import type { authClient } from "@/lib/auth";
import { SessionProvider } from "@/hooks/use-session";
import { getFullOrganizationQueryOptions } from "@/services/resources/organization";
import { listMembersQueryOptions, listInvitationsQueryOptions } from "@/services/resources/member";

type Session = typeof authClient.$Infer.Session;

const session: Session = {
  user: {
    id: "user-1",
    name: "Jane Doe",
    email: "jane@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    role: "client",
    banned: false,
    banReason: null,
    banExpires: null,
    username: "janedoe",
    displayUsername: "Jane Doe",
    locale: "en",
    theme: "system",
  },
  session: {
    id: "session-1",
    userId: "user-1",
    token: "token",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    expiresAt: new Date("2027-01-01"),
    ipAddress: null,
    userAgent: null,
    activeOrganizationId: "org-1",
  },
};

function withRouter(children: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => children });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return <RouterProvider router={router} />;
}

function withSeededQueryClient(isPersonal: boolean) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(getFullOrganizationQueryOptions({ organizationId: "org-1" }).queryKey, {
    id: "org-1",
    name: "Acme Inc",
    slug: "acme-inc",
    isPersonal,
    createdAt: new Date("2026-01-01"),
    metadata: null,
    logo: null,
    members: [],
    invitations: [],
  });
  queryClient.setQueryData(
    listMembersQueryOptions({ organizationId: "org-1", isPersonal, limit: 20, offset: 0 }).queryKey,
    { members: [], total: 0 },
  );
  queryClient.setQueryData(listInvitationsQueryOptions({ organizationId: "org-1" }).queryKey, []);
  return queryClient;
}

const meta = {
  title: "Features/Organization/SuspendedOrganizationSettings",
  component: SuspendedOrganizationSettings,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { organizationId: "org-1", currentMemberRole: "owner", limit: 20, offset: 0 },
  decorators: [
    (Story) => (
      <SessionProvider session={session}>
        {withRouter(
          <div className="p-6">
            <Story />
          </div>,
        )}
      </SessionProvider>
    ),
  ],
} satisfies Meta<typeof SuspendedOrganizationSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededQueryClient(false)}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const Personal: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededQueryClient(true)}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
