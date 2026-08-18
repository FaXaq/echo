import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DriveExplorer } from "./drive-explorer";
import {
  getFolderContentsQueryOptions,
  getFolderPathQueryKey,
  type Folder,
  type OrganizationFile,
} from "@/services/resources/drive";
import { selfListOrganizations, type Organizations } from "@/services/resources/organization";

function makeOrganization(overrides: Partial<Organizations[number]>): Organizations[number] {
  return {
    id: "org-1",
    name: "Acme Band",
    slug: "acme",
    isPersonal: false,
    ...overrides,
  };
}

function makeFolder(overrides: Partial<Folder>): Folder {
  return {
    id: Math.random().toString(36),
    organizationId: "org-1",
    parentFolderId: null,
    name: "Demos",
    createdAt: "2026-08-02T09:30:00.000Z",
    updatedAt: "2026-08-02T09:30:00.000Z",
    ...overrides,
  };
}

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

function withSeededDrive(opts: {
  folderId: string | null;
  folders: Folder[];
  files: OrganizationFile[];
  path?: Folder[];
}) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    getFolderContentsQueryOptions({ folderId: opts.folderId, organizationId: "org-1" }).queryKey,
    { folders: opts.folders, files: opts.files },
  );
  queryClient.setQueryData(
    getFolderPathQueryKey({ folderId: opts.folderId, organizationId: "org-1" }),
    opts.path ?? [],
  );
  queryClient.setQueryData(selfListOrganizations().queryKey, [makeOrganization({})]);
  return queryClient;
}

const meta = {
  title: "Features/Drive/DriveExplorer",
  component: DriveExplorer,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { organizationId: "org-1", projectSlug: "acme", folderId: null },
  decorators: [
    (Story) => (
      <div className="flex h-[520px] flex-col p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DriveExplorer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Root: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededDrive({
          folderId: null,
          folders: [
            makeFolder({ id: "folder-1", name: "Demos" }),
            makeFolder({ id: "folder-2", name: "Artwork" }),
          ],
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
        })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const NestedFolder: Story = {
  args: { folderId: "folder-1" },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededDrive({
          folderId: "folder-1",
          folders: [],
          files: [
            makeFile({
              id: "file-3",
              kind: "image",
              mimeType: "image/png",
              filename: "cover.png",
              originalFilename: "cover.png",
              sizeBytes: 245_000,
            }),
          ],
          path: [makeFolder({ id: "folder-1", name: "Demos" })],
        })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={withSeededDrive({ folderId: null, folders: [], files: [] })}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
