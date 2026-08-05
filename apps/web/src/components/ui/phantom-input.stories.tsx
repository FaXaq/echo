import type { Meta, StoryObj } from "@storybook/react";
import { PhantomInput } from "@/components/ui/phantom-input";

const meta = {
  title: "UI/PhantomInput",
  component: PhantomInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PhantomInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
  args: {
    placeholder: "Type something...",
  },
};

export const WithDefaultValue: Story = {
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
  args: {
    defaultValue: "My song title",
  },
};
