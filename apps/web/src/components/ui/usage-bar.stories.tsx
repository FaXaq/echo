import type { Meta, StoryObj } from "@storybook/react";
import { UsageBar } from "./usage-bar";

const meta = {
  title: "UI/UsageBar",
  component: UsageBar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { label: "Storage", used: "448.6 KB", limit: "1.0 GB", ratio: 448_623 / 1_000_000_000 },
} satisfies Meta<typeof UsageBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: { used: "0 B", ratio: 0 },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const NearLimit: Story = {
  args: { used: "950.0 MB", ratio: 950_000_000 / 1_000_000_000 },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const OverLimit: Story = {
  args: { used: "1.2 GB", ratio: 1.2 },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};
