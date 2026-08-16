import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuspendedDriveQuotaBar } from "./suspended-drive-quota-bar";
import { getStorageQuotaQueryOptions, type StorageQuota } from "@/services/resources/plan";

function withSeededQuota(quota: StorageQuota) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    getStorageQuotaQueryOptions({ organizationId: "org-1" }).queryKey,
    quota,
  );
  return queryClient;
}

const meta = {
  title: "Features/Drive/SuspendedDriveQuotaBar",
  component: SuspendedDriveQuotaBar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { organizationId: "org-1" },
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SuspendedDriveQuotaBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SmallUsage: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededQuota({ storageBytes: 448_623, limitBytes: 1_000_000_000 })}
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
        client={withSeededQuota({ storageBytes: 950_000_000, limitBytes: 1_000_000_000 })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};
