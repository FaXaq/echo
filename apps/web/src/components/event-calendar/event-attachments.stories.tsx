import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EventAttachments } from "./event-attachments";
import { getEventFilesQueryOptions, type EventFile } from "@/services/resources/file";

function withSeededFiles(files: EventFile[]) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(getEventFilesQueryOptions({ eventId: "event-1" }).queryKey, files);
  return queryClient;
}

const meta = {
  title: "EventCalendar/EventAttachments",
  component: EventAttachments,
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
} satisfies Meta<typeof EventAttachments>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { eventId: "event-1" },
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededFiles([])}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const WithMixedFiles: Story = {
  args: { eventId: "event-1" },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededFiles([
          {
            id: "file-1",
            kind: "audio",
            originalFilename: "demo.mp3",
            downloadUrl: "https://example.com/demo.mp3",
          } as EventFile,
          {
            id: "file-2",
            kind: "image",
            originalFilename: "cover.png",
            downloadUrl: "https://example.com/cover.png",
          } as EventFile,
          {
            id: "file-3",
            kind: "video",
            originalFilename: "clip.mp4",
            downloadUrl: "https://example.com/clip.mp4",
          } as EventFile,
        ])}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};
