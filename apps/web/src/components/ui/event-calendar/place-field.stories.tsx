import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { PlaceField } from "./place-field";
import type { EventPlace } from "./types";

function PlaceFieldDemo({ initialValue }: { initialValue: EventPlace | null }) {
  const [value, setValue] = useState<EventPlace | null>(initialValue);
  return <PlaceField value={value} onChange={setValue} />;
}

const meta = {
  title: "UI/EventCalendar/PlaceField",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlaceFieldDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => <PlaceFieldDemo initialValue={null} />,
};

export const WithValue: Story = {
  render: () => (
    <PlaceFieldDemo
      initialValue={{
        name: "Le Duplex",
        address: "42 rue de la République, 69002 Lyon, France",
        lat: 45.764,
        lng: 4.8357,
      }}
    />
  ),
};
