import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuspendedEventAttachments } from "./suspended-event-attachments";
import { getEventFilesQueryOptions, type EventFile } from "@/services/resources/file";

function withSeededFiles(files: EventFile[]) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    getEventFilesQueryOptions({ eventId: "event-1", organizationId: "org-1" }).queryKey,
    files,
  );
  return queryClient;
}

const meta = {
  title: "EventCalendar/SuspendedEventAttachments",
  component: SuspendedEventAttachments,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SuspendedEventAttachments>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { eventId: "event-1", organizationId: "org-1" },
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededFiles([])}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const WithMixedFiles: Story = {
  args: { eventId: "event-1", organizationId: "org-1" },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededFiles([
          {
            id: "file-1",
            kind: "audio",
            originalFilename: "demo.mp3",
            filename: "demo.mp3",
            downloadUrl: "https://example.com/demo.mp3",
            sizeBytes: 6_400_000,
            uploadedByName: "Priya",
          } as EventFile,
          {
            id: "file-2",
            kind: "image",
            originalFilename: "cover.png",
            filename: "cover.png",
            downloadUrl: "https://example.com/cover.png",
            sizeBytes: 245_000,
            uploadedByName: "Jamie",
          } as EventFile,
          {
            id: "file-3",
            kind: "video",
            originalFilename: "clip.mp4",
            filename: "clip.mp4",
            downloadUrl: "https://example.com/clip.mp4",
            sizeBytes: 18_200_000,
            uploadedByName: "Marcus",
          } as EventFile,
          {
            id: "file-4",
            kind: "document",
            originalFilename: "setlist.pdf",
            filename: "setlist.pdf",
            downloadUrl: "https://example.com/setlist.pdf",
            sizeBytes: 86_000,
            uploadedByName: "Jamie",
          } as EventFile,
        ])}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};
