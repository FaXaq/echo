import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "@/components/ui/separator";

const meta = {
  title: "UI/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  decorators: [
    (Story) => (
      <div className="w-64">
        <p className="text-sm">Above</p>
        <Story />
        <p className="text-sm">Below</p>
      </div>
    ),
  ],
  args: {
    orientation: "horizontal",
  },
};

export const Vertical: Story = {
  decorators: [
    (Story) => (
      <div className="flex h-8 items-center gap-2">
        <span className="text-sm">Left</span>
        <Story />
        <span className="text-sm">Right</span>
      </div>
    ),
  ],
  args: {
    orientation: "vertical",
  },
};
