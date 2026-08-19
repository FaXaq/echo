import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "@/components/ui/scroll-area";

const meta = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-64 w-64 rounded-md border p-4">
      <div className="flex flex-col gap-3">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-sm">
            Track {i + 1}
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};
