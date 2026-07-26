import { describe, expect, it } from "vitest";
import { listEventFiles } from "./list-event-files.js";
import { makeFakeFileRepo, makeFakeS3Storage, makeFakeUserPermission } from "./test-fixtures.js";

const personalFile = {
  id: "file-1",
  eventId: "event-1",
  organizationId: null,
  uploadedBy: "user-1",
  kind: "image" as const,
  mimeType: "image/png",
  sizeBytes: 100,
  originalFilename: "cover.png",
  s3Key: "personal/user-1/file-1/cover.png",
  status: "uploaded" as const,
};

const orgFile = {
  ...personalFile,
  id: "file-2",
  organizationId: "org-1",
  uploadedBy: "user-2",
  s3Key: "org/org-1/file-2/cover.png",
};

describe("listEventFiles", () => {
  it("returns the uploader's own personal file with a downloadUrl", async () => {
    const files = await listEventFiles(
      {
        db: {} as never,
        fileRepo: makeFakeFileRepo([personalFile]),
        userPermission: makeFakeUserPermission(),
        s3Storage: makeFakeS3Storage(),
      },
      { eventId: "event-1", userId: "user-1" },
    );

    expect(files.map((f) => f.id)).toEqual(["file-1"]);
    expect(files[0].downloadUrl).toBe(
      "https://fake-s3.local/personal/user-1/file-1/cover.png?download",
    );
  });

  it("excludes another user's personal file when selfRead/read are both denied", async () => {
    const files = await listEventFiles(
      {
        db: {} as never,
        fileRepo: makeFakeFileRepo([personalFile]),
        userPermission: makeFakeUserPermission({
          userHasPermission: async () => ({ success: false, error: null }),
        }),
        s3Storage: makeFakeS3Storage(),
      },
      { eventId: "event-1", userId: "someone-else" },
    );

    expect(files).toEqual([]);
  });

  it("returns an organization file when the caller has org file:read", async () => {
    const files = await listEventFiles(
      {
        db: {} as never,
        fileRepo: makeFakeFileRepo([orgFile]),
        userPermission: makeFakeUserPermission(),
        s3Storage: makeFakeS3Storage(),
      },
      { eventId: "event-1", userId: "user-3" },
    );

    expect(files.map((f) => f.id)).toEqual(["file-2"]);
  });

  it("excludes an organization file when the caller lacks org file:read", async () => {
    const files = await listEventFiles(
      {
        db: {} as never,
        fileRepo: makeFakeFileRepo([orgFile]),
        userPermission: makeFakeUserPermission({
          userHasPermissionInOrganization: async () => ({
            success: false,
            error: null,
            role: null,
          }),
        }),
        s3Storage: makeFakeS3Storage(),
      },
      { eventId: "event-1", userId: "user-3" },
    );

    expect(files).toEqual([]);
  });
});
