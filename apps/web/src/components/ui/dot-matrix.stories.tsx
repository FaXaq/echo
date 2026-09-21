import type { Meta, StoryObj } from "@storybook/react";
import { DotMatrix } from "@/components/ui/dot-matrix";

const meta = {
  title: "UI/DotMatrix",
  component: DotMatrix,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    gap: {
      control: { type: "range", min: 0, max: 0.9, step: 0.05 },
    },
  },
} satisfies Meta<typeof DotMatrix>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    matrix: [
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ],
    className: "size-8",
  },
};

export const Large: Story = {
  args: {
    matrix: [
      [1, 0, 0, 0, 1],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [1, 0, 0, 0, 1],
    ],
    className: "size-32",
  },
};

export const ContinuousOpacity: Story = {
  args: {
    matrix: [
      [0, 0.25, 0.5, 0.75, 1],
      [0.25, 0.5, 0.75, 1, 0.75],
      [0.5, 0.75, 1, 0.75, 0.5],
      [0.75, 1, 0.75, 0.5, 0.25],
      [1, 0.75, 0.5, 0.25, 0],
    ],
    className: "size-32",
  },
};

export const Empty: Story = {
  args: {
    matrix: [],
    className: "size-8",
  },
};

export const TightGap: Story = {
  args: {
    ...Large.args,
    gap: 0,
  },
};

export const WideGap: Story = {
  args: {
    ...Large.args,
    gap: 0.6,
  },
};
