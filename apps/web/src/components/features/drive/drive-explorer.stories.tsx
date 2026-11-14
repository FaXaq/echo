import type { Meta, StoryObj } from "@storybook/react";
import type { DriveLocation } from "@echo/modules/drive/domain";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DriveExplorer } from "./drive-explorer";
import {
  getDriveLocationPathQueryKey,
  listFolderContentsQueryOptions,
  type Folder,
  type FolderContents,
  type OrganizationFile,
} from "@/services/resources/drive";
import { selfListOrganizations, type Organizations } from "@/services/resources/organization";

function makeOrganization(overrides: Partial<Organizations[number]>): Organizations[number] {
  return {
    id: "org-1",
    name: "Acme Band",
    slug: "acme",
    isPersonal: false,
    logoPattern: [],
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
    organizationId: "org-1",
    uploadedBy: "user-1",
    uploadedByName: "Jane Doe",
    kind: "document",
    mimeType: "application/pdf",
    sizeBytes: 86_000,
    durationSeconds: null,
    width: null,
    height: null,
    hasThumbnail: false,
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
  location: DriveLocation;
  folders: Folder[];
  files: OrganizationFile[];
  systemFolders?: FolderContents["systemFolders"];
  path?: { name: string; location: DriveLocation }[];
}) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    listFolderContentsQueryOptions({
      location: opts.location,
      organizationId: "org-1",
      sort: "name",
      order: "asc",
    }).queryKey,
    { folders: opts.folders, systemFolders: opts.systemFolders ?? [], files: opts.files },
  );
  queryClient.setQueryData(
    getDriveLocationPathQueryKey({ location: opts.location, organizationId: "org-1" }),
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
  args: {
    organizationId: "org-1",
    projectSlug: "acme",
    location: { kind: "root" },
    sort: "name",
    order: "asc",
    onSortChange: () => {},
  },
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
          location: { kind: "root" },
          systemFolders: [
            { location: { kind: "events" }, name: "Events" },
            { location: { kind: "songs" }, name: "Songs" },
          ],
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
  args: { location: { kind: "folder", id: "folder-1" } },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededDrive({
          location: { kind: "folder", id: "folder-1" },
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
          path: [{ name: "Demos", location: { kind: "folder", id: "folder-1" } }],
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
      <QueryClientProvider
        client={withSeededDrive({ location: { kind: "root" }, folders: [], files: [] })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export const EventsRootEmpty: Story = {
  args: { location: { kind: "events" } },
  decorators: [
    (Story) => (
      <QueryClientProvider
        client={withSeededDrive({
          location: { kind: "events" },
          folders: [],
          files: [],
          path: [{ name: "Events", location: { kind: "events" } }],
        })}
      >
        <Story />
      </QueryClientProvider>
    ),
  ],
};
