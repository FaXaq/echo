import type { Meta, StoryObj } from "@storybook/react";
import { FileUpload } from "@/components/ui/file-upload";

const meta = {
  title: "UI/FileUpload",
  component: FileUpload,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    multiple: { control: "boolean" },
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    accept: "audio/*,video/*,image/*",
    variant: "box",
    onFilesSelected: (files) => console.log("selected", files),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    variant: "box",
    onFilesSelected: (files) => console.log("selected", files),
  },
};
