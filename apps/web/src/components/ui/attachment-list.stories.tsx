import type { Meta, StoryObj } from "@storybook/react";
import { AttachmentList } from "@/components/ui/attachment-list";
import type { EventFile } from "@/services/resources/drive";

function makeFile(overrides: Partial<EventFile>): EventFile {
  return {
    id: Math.random().toString(36),
    eventId: "event-1",
    eventTitle: null,
    songId: null,
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
    downloadUrl: "https://example.com/setlist.pdf",
    ...overrides,
  };
}

const meta = {
  title: "UI/AttachmentList",
  component: AttachmentList,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AttachmentList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    files: [
      makeFile({ id: "file-1", filename: "setlist.pdf" }),
      makeFile({
        id: "file-2",
        kind: "audio",
        mimeType: "audio/mpeg",
        filename: "demo.mp3",
        originalFilename: "demo.mp3",
        sizeBytes: 6_400_000,
      }),
    ],
    onDelete: () => {},
    onRename: () => {},
    onDownload: () => {},
  },
};

export const Empty: Story = {
  args: { files: [] },
};
