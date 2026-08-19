import type { Meta, StoryObj } from "@storybook/react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const meta = {
  title: "UI/AspectRatio",
  component: AspectRatio,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    ratio: { control: "number" },
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { ratio: 16 / 9, className: "w-96" },
  render: (args) => (
    <AspectRatio {...args}>
      <div className="flex size-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
        16:9
      </div>
    </AspectRatio>
  ),
};

export const Square: Story = {
  args: { ratio: 1, className: "w-64" },
  render: (args) => (
    <AspectRatio {...args}>
      <div className="flex size-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
        1:1
      </div>
    </AspectRatio>
  ),
};
