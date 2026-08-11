import type { Meta, StoryObj } from "@storybook/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { UserMenu } from "@/components/user-menu";
import { ThemeProvider } from "@/contexts/theme";

function withRouter(children: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => children });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return <RouterProvider router={router} />;
}

const meta = {
  title: "Components/UserMenu",
  component: UserMenu,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onLogout: () => {} },
  decorators: [
    (Story) => (
      <ThemeProvider>
        {withRouter(
          <div className="flex justify-end p-8">
            <Story />
          </div>,
        )}
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { username: "janedoe", name: "Jane Doe", email: "jane@example.com" },
};

export const WithAvatar: Story = {
  args: {
    username: "janedoe",
    name: "Jane Doe",
    email: "jane@example.com",
    image: "https://i.pravatar.cc/64?img=5",
  },
};
