import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "@/components/ui/spinner";

const meta = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    className: "size-3",
  },
};

export const Medium: Story = {
  args: {
    className: "size-5",
  },
};

export const Large: Story = {
  args: {
    className: "size-8",
  },
};

export const ExtraLarge: Story = {
  args: {
    className: "size-12",
  },
};
