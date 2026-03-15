import type { Meta, StoryObj } from "@storybook/react";
import { AddTrackForm } from "./-add-track-form";

const meta = {
  title: "DAW/AddTrackForm",
  component: AddTrackForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AddTrackForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    songId: "song-1",
    onTrackAdded: () => {},
  },
};
