import type { Meta, StoryObj } from "@storybook/react";
import { EditableBadge } from "@/components/ui/editable-badge";

const meta = {
  title: "UI/EditableBadge",
  component: EditableBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "number"],
    },
  },
} satisfies Meta<typeof EditableBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Title",
    value: "My Song",
    onSave: (value) => console.log("Saved:", value),
  },
};

export const Number: Story = {
  args: {
    label: "BPM",
    value: 120,
    type: "number",
    onSave: (value) => console.log("Saved:", value),
  },
};

export const Empty: Story = {
  args: {
    label: "Artist",
    value: "",
    placeholder: "Unknown",
    onSave: (value) => console.log("Saved:", value),
  },
};
