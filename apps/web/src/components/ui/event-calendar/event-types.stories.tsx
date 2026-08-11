import type { Meta, StoryObj } from "@storybook/react";

import { EventTypeIcon } from "./event-types";
import { EVENT_TYPES } from "./types";

const meta = {
  title: "UI/EventCalendar/EventTypeIcon",
  component: EventTypeIcon,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof EventTypeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { type: null },
};

export const AllTypes: Story = {
  args: { type: null },
  render: () => (
    <div className="flex items-center gap-4">
      <EventTypeIcon type={null} />
      {EVENT_TYPES.map((type) => (
        <EventTypeIcon key={type} type={type} />
      ))}
    </div>
  ),
};
