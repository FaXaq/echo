import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuspendedPlanUsage } from "./suspended-plan-usage";
import {
  getPlanOverviewQueryOptions,
  getStorageQuotaQueryOptions,
  type PlanOverview,
  type StorageQuota,
} from "@/services/resources/plan";

function withSeededQueryClient(memberSeats: number, quota: StorageQuota) {
  const queryClient = new QueryClient();
  const overview: PlanOverview = {
    plan: "free",
    limits: { memberSeats: 3, maxFileSizeBytes: 50_000_000 },
    features: { customSlug: false, pdfExport: false, publicPages: false },
    usage: { memberSeats },
  };
  queryClient.setQueryData(
    getPlanOverviewQueryOptions({ organizationId: "org-1" }).queryKey,
    overview,
  );
  queryClient.setQueryData(
    getStorageQuotaQueryOptions({ organizationId: "org-1" }).queryKey,
    quota,
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
      <QueryClientProvider
        client={withSeededQueryClient(1, { storageBytes: 0, limitBytes: 1_000_000_000 })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const SmallUsage: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededQueryClient(1, { storageBytes: 448_623, limitBytes: 1_000_000_000 })}
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
        client={withSeededQueryClient(3, { storageBytes: 950_000_000, limitBytes: 1_000_000_000 })}
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
        client={withSeededQueryClient(1, { storageBytes: 448_623, limitBytes: 1_000_000_000 })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};
