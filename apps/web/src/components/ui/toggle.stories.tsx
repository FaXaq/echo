import type { Meta, StoryObj } from "@storybook/react";
import { BoldIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
    size: { control: "select", options: ["default", "sm", "lg"] },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <BoldIcon />, "aria-label": "Toggle bold" },
};

export const Outline: Story = {
  args: { children: <BoldIcon />, variant: "outline", "aria-label": "Toggle bold" },
};

export const Pressed: Story = {
  args: { children: <BoldIcon />, defaultPressed: true, "aria-label": "Toggle bold" },
};

export const Disabled: Story = {
  args: { children: <BoldIcon />, disabled: true, "aria-label": "Toggle bold" },
};
