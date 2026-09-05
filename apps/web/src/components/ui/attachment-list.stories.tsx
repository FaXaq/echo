import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AttachmentList } from "@/components/ui/attachment-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export const Uploading: Story = {
  args: {
    files: [makeFile({ id: "file-1", filename: "setlist.pdf" })],
    pendingFiles: [{ key: 1, filename: "demo.mp3", sizeBytes: 6_400_000, kind: "audio" }],
    onDelete: () => {},
    onRename: () => {},
    onDownload: () => {},
  },
};

export const Tabs: Story = {
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
      makeFile({
        id: "file-3",
        kind: "image",
        mimeType: "image/png",
        filename: "cover.png",
        originalFilename: "cover.png",
        sizeBytes: 240_000,
      }),
      makeFile({
        id: "file-4",
        kind: "video",
        mimeType: "video/mp4",
        filename: "rehearsal.mp4",
        originalFilename: "rehearsal.mp4",
        sizeBytes: 12_000_000,
      }),
    ],
    onDelete: () => {},
    onRename: () => {},
    onDownload: () => {},
  },
};

export const Gallery: Story = {
  args: {
    files: Array.from({ length: 7 }, (_, index) =>
      makeFile({
        id: `image-${index}`,
        kind: "image",
        mimeType: "image/png",
        filename: `photo-${index + 1}.png`,
        originalFilename: `photo-${index + 1}.png`,
        downloadUrl: `https://picsum.photos/seed/${index}/300/300`,
        sizeBytes: 240_000,
      }),
    ),
    onDelete: () => {},
    onRename: () => {},
    onDownload: () => {},
  },
};

export const WithActions: Story = {
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
    actions: (
      <div className="flex items-center gap-2">
        <Input placeholder="Search…" className="h-8 w-40" />
        <Button size="sm" variant="outline">
          Upload
        </Button>
      </div>
    ),
    onDelete: () => {},
    onRename: () => {},
    onDownload: () => {},
  },
};

function WithSelectionDemo() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const files = [
    makeFile({ id: "file-1", filename: "setlist.pdf" }),
    makeFile({
      id: "file-2",
      kind: "audio",
      mimeType: "audio/mpeg",
      filename: "demo.mp3",
      originalFilename: "demo.mp3",
      sizeBytes: 6_400_000,
    }),
  ];

  return (
    <AttachmentList
      files={files}
      selectedIds={selectedIds}
      onSelect={(file) => setSelectedIds((prev) => new Set(prev).add(file.id))}
      onUnselect={(file) =>
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
        })
      }
      onDeleteSelected={async (deleted) => {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          deleted.forEach((file) => next.delete(file.id));
          return next;
        });
      }}
      onDelete={() => {}}
      onRename={() => {}}
      onDownload={() => {}}
    />
  );
}

export const WithSelection: Story = {
  args: { files: [] },
  render: () => <WithSelectionDemo />,
};
