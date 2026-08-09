import type { Meta, StoryObj } from "@storybook/react";
import { EventGallery } from "./event-gallery";
import type { EventFile } from "@/services/resources/file";

const files: EventFile[] = [
  {
    id: "file-1",
    kind: "image",
    originalFilename: "cover.png",
    downloadUrl: "https://example.com/cover.png",
  } as EventFile,
  {
    id: "file-2",
    kind: "video",
    originalFilename: "clip.mp4",
    downloadUrl: "https://example.com/clip.mp4",
  } as EventFile,
  {
    id: "file-3",
    kind: "image",
    originalFilename: "poster.jpg",
    downloadUrl: "https://example.com/poster.jpg",
  } as EventFile,
];

const meta = {
  title: "UI/EventGallery",
  component: EventGallery,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { files },
};
