import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuspendedPlanUsage } from "./suspended-plan-usage";
import { getPlanOverviewQueryOptions, type PlanOverview } from "@/services/resources/plan";

function withSeededQueryClient(usage: PlanOverview["usage"]) {
  const queryClient = new QueryClient();
  const overview: PlanOverview = {
    plan: "free",
    limits: { storageBytes: 1_000_000_000, memberSeats: 3, maxFileSizeBytes: 50_000_000 },
    features: { customSlug: false, pdfExport: false, publicPages: false },
    usage,
  };
  queryClient.setQueryData(
    getPlanOverviewQueryOptions({ organizationId: "org-1" }).queryKey,
    overview,
  );
  return queryClient;
}

const meta = {
  title: "Features/Organization/SuspendedPlanUsage",
  component: SuspendedPlanUsage,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { organizationId: "org-1", isPersonal: false },
} satisfies Meta<typeof SuspendedPlanUsage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededQueryClient({ storageBytes: 0, memberSeats: 1 })}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const SmallUsage: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededQueryClient({ storageBytes: 448_623, memberSeats: 1 })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const NearLimit: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededQueryClient({ storageBytes: 950_000_000, memberSeats: 3 })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const Personal: Story = {
  args: { isPersonal: true },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededQueryClient({ storageBytes: 448_623, memberSeats: 1 })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};
