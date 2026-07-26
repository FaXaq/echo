import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EventFileAttachments } from "./event-file-attachments";
import { getEventFilesQueryOptions, type EventFile } from "@/services/resources/file";

function withSeededFiles(files: EventFile[]) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(getEventFilesQueryOptions({ eventId: "event-1" }).queryKey, files);
  return queryClient;
}

const meta = {
  title: "EventCalendar/EventFileAttachments",
  component: EventFileAttachments,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EventFileAttachments>;

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

export const WithFiles: Story = {
  args: { eventId: "event-1" },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededFiles([
          { id: "file-1", originalFilename: "demo.mp3" } as EventFile,
          { id: "file-2", originalFilename: "cover.png" } as EventFile,
        ])}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};
