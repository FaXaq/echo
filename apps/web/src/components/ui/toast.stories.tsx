import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "@/components/ui/toast";

const meta = {
  title: "UI/Toast",
  component: Toaster,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="relative h-40 w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Toaster>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({ title: "Event created", description: "Rehearsal added to the calendar." })
        }
      >
        Show toast
      </Button>
    </Toaster>
  ),
};

export const Success: Story = {
  render: () => (
    <Toaster>
      <Button variant="outline" onClick={() => toast.add({ title: "Saved", type: "success" })}>
        Show success toast
      </Button>
    </Toaster>
  ),
};

export const Error: Story = {
  render: () => (
    <Toaster>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({ title: "Couldn't save", description: "Try again.", type: "error" })
        }
      >
        Show error toast
      </Button>
    </Toaster>
  ),
};
