import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "@/components/ui/textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Write your notes here…", className: "w-80" },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Rehearsal went well, need to tighten up the bridge section.",
    className: "w-80",
  },
};

export const Disabled: Story = {
  args: { defaultValue: "Can't edit this right now.", disabled: true, className: "w-80" },
};

export const Invalid: Story = {
  args: { defaultValue: "", "aria-invalid": true, className: "w-80" },
};
