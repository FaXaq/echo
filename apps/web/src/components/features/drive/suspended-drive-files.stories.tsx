import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuspendedDriveFiles } from "./suspended-drive-files";
import { getOrganizationFilesQueryOptions, type OrganizationFile } from "@/services/resources/file";

function makeFile(overrides: Partial<OrganizationFile>): OrganizationFile {
  return {
    id: Math.random().toString(36),
    eventId: null,
    folderId: null,
    organizationId: "org-1",
    uploadedBy: "user-1",
    uploadedByName: "Jane Doe",
    kind: "document",
    mimeType: "application/pdf",
    sizeBytes: 86_000,
    filename: "setlist.pdf",
    originalFilename: "setlist.pdf",
    s3Key: "s3-key",
    status: "uploaded",
    createdAt: "2026-08-02T09:30:00.000Z",
    updatedAt: "2026-08-02T09:30:00.000Z",
    ...overrides,
  };
}

function withSeededFiles(files: OrganizationFile[]) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    getOrganizationFilesQueryOptions({ organizationId: "org-1" }).queryKey,
    files,
  );
  return queryClient;
}

const meta = {
  title: "Features/Drive/SuspendedDriveFiles",
  component: SuspendedDriveFiles,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { organizationId: "org-1" },
  decorators: [
    (Story) => (
      <div className="flex h-[480px] flex-col p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SuspendedDriveFiles>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededFiles([
          makeFile({ id: "file-1", filename: "setlist.pdf" }),
          makeFile({
            id: "file-2",
            kind: "audio",
            mimeType: "audio/mpeg",
            filename: "demo.mp3",
            originalFilename: "demo.mp3",
            sizeBytes: 6_400_000,
          }),
          makeFile({
            id: "file-3",
            kind: "image",
            mimeType: "image/png",
            filename: "cover.png",
            originalFilename: "cover.png",
            sizeBytes: 245_000,
          }),
        ])}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const ManyFiles: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededFiles(
          Array.from({ length: 40 }, (_, index) =>
            makeFile({
              id: `file-${index}`,
              filename: `2026-08-${String((index % 28) + 1).padStart(2, "0")}-rehearsal-take-${index + 1}-master-bounce.wav`,
              originalFilename: `take-${index + 1}.wav`,
              kind: "audio",
              mimeType: "audio/wav",
              sizeBytes: 40_000_000 + index * 1_500_000,
              uploadedByName: `Bandmate Number ${index + 1}`,
            }),
          ),
        )}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededFiles([])}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
