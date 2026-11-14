import { describe, expect, it } from "vitest";
import { ForbiddenError, ConflictError, NotFoundError, QuotaExceededError } from "@echo/errors";
import { planCatalog } from "@echo/modules/plan/domain";
import { createOrganizationScope, type OrganizationScope } from "@echo/modules/shared/domain";
import { MAX_PREVIEW_BYTES, type Place } from "../domain/index.js";
import type { InsertPendingFileInput } from "../infrastructure/index.js";
import { createUpload } from "./create-upload.js";
import {
  makeFakeDb,
  makeFakeS3Storage,
  makeFakePermissionChecks,
  makeFakeInsertPendingFile,
  makeFakeEventExistsInOrganization,
  makeFakeSongExistsInOrganization,
  makeFakePersonalOrganizationId,
  makeFakeQuotaPorts,
  makeFakeFindFolderById,
} from "./test-fixtures.js";

const baseInput = {
  userId: "user-1",
  scope: createOrganizationScope("org-1"),
  mimeType: "audio/mpeg",
  sizeBytes: 1024,
  filename: "demo.mp3",
  place: { kind: "root" } satisfies Place,
};

describe("createUpload", () => {
  it("rejects an unsupported mime type", async () => {
    await expect(
      createUpload(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          insertPendingFileCommand: makeFakeInsertPendingFile(),
          eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
          songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          s3Storage: makeFakeS3Storage(),
          ...makeFakePermissionChecks(),
          ...makeFakeQuotaPorts(),
        },
        { ...baseInput, mimeType: "application/zip" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects an organization upload when the user lacks org drive:create", async () => {
    await expect(
      createUpload(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          insertPendingFileCommand: makeFakeInsertPendingFile(),
          eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
          songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          s3Storage: makeFakeS3Storage(),
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
          ...makeFakeQuotaPorts(),
        },
        baseInput,
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("attributes the upload to the requested organization", async () => {
    const inserted: { scope: OrganizationScope; input: InsertPendingFileInput }[] = [];

    await createUpload(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        s3Storage: makeFakeS3Storage(),
        insertPendingFileCommand: makeFakeInsertPendingFile((scope, input) =>
          inserted.push({ scope, input }),
        ),
        eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
        songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
        getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
        ...makeFakePermissionChecks(),
        ...makeFakeQuotaPorts(),
      },
      baseInput,
    );

    expect(inserted).toHaveLength(1);
    expect(inserted[0].scope.organizationId).toBe("org-1");
  });

  it("passes durationSeconds through to the inserted file when provided", async () => {
    const inserted: InsertPendingFileInput[] = [];

    await createUpload(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        s3Storage: makeFakeS3Storage(),
        insertPendingFileCommand: makeFakeInsertPendingFile((_scope, input) =>
          inserted.push(input),
        ),
        eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
        songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
        getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
        ...makeFakePermissionChecks(),
        ...makeFakeQuotaPorts(),
      },
      { ...baseInput, durationSeconds: 183 },
    );

    expect(inserted[0].durationSeconds).toBe(183);
  });

  it("defaults durationSeconds to null when the client didn't provide one", async () => {
    const inserted: InsertPendingFileInput[] = [];

    await createUpload(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        s3Storage: makeFakeS3Storage(),
        insertPendingFileCommand: makeFakeInsertPendingFile((_scope, input) =>
          inserted.push(input),
        ),
        eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
        songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
        getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
        ...makeFakePermissionChecks(),
        ...makeFakeQuotaPorts(),
      },
      baseInput,
    );

    expect(inserted[0].durationSeconds).toBeNull();
  });

  describe("place", () => {
    const deps = (
      overrides: Partial<{
        findFolderByIdQuery: ReturnType<typeof makeFakeFindFolderById>;
        eventExistsInOrganizationQuery: ReturnType<typeof makeFakeEventExistsInOrganization>;
        songExistsInOrganizationQuery: ReturnType<typeof makeFakeSongExistsInOrganization>;
        insertPendingFileCommand: ReturnType<typeof makeFakeInsertPendingFile>;
      }> = {},
    ) => ({
      db: makeFakeDb(),
      findFolderByIdQuery: makeFakeFindFolderById(),
      s3Storage: makeFakeS3Storage(),
      insertPendingFileCommand: makeFakeInsertPendingFile(),
      eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
      songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
      getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
      ...makeFakePermissionChecks(),
      ...makeFakeQuotaPorts(),
      ...overrides,
    });

    it.each([
      { kind: "root" },
      { kind: "folder", id: "folder-1" },
      { kind: "event", id: "event-1" },
      { kind: "song", id: "song-1" },
    ] satisfies Place[])("inserts the file with its $kind place", async (place) => {
      const inserted: InsertPendingFileInput[] = [];

      await createUpload(
        deps({ insertPendingFileCommand: makeFakeInsertPendingFile((_s, i) => inserted.push(i)) }),
        { ...baseInput, place },
      );

      expect(inserted[0].place).toEqual(place);
    });

    it.each([
      {
        place: { kind: "folder", id: "x" },
        deps: { findFolderByIdQuery: makeFakeFindFolderById(null) },
      },
      {
        place: { kind: "event", id: "x" },
        deps: { eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(false) },
      },
      {
        place: { kind: "song", id: "x" },
        deps: { songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(false) },
      },
    ] satisfies { place: Place; deps: Parameters<typeof deps>[0] }[])(
      "rejects a place whose $place.kind isn't in this organization",
      async ({ place, deps: overrides }) => {
        const inserted: InsertPendingFileInput[] = [];

        await expect(
          createUpload(
            deps({
              ...overrides,
              insertPendingFileCommand: makeFakeInsertPendingFile((_s, i) => inserted.push(i)),
            }),
            { ...baseInput, place },
          ),
        ).rejects.toBeInstanceOf(NotFoundError);

        expect(inserted).toEqual([]);
      },
    );
  });

  it("rejects a file larger than the plan's max file size", async () => {
    await expect(
      createUpload(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          s3Storage: makeFakeS3Storage(),
          insertPendingFileCommand: makeFakeInsertPendingFile(),
          eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
          songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          ...makeFakePermissionChecks(),
          ...makeFakeQuotaPorts(),
        },
        { ...baseInput, sizeBytes: planCatalog.free.limits.maxFileSizeBytes + 1 },
      ),
    ).rejects.toBeInstanceOf(QuotaExceededError);
  });

  it("allows a file exactly at the plan's max file size", async () => {
    const result = await createUpload(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        s3Storage: makeFakeS3Storage(),
        insertPendingFileCommand: makeFakeInsertPendingFile(),
        eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
        songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
        getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
        ...makeFakePermissionChecks(),
        ...makeFakeQuotaPorts(),
      },
      { ...baseInput, sizeBytes: planCatalog.free.limits.maxFileSizeBytes },
    );

    expect(result.uploadUrl).toContain("https://fake-s3.local/");
  });

  it("rejects an upload that would exceed the storage quota", async () => {
    await expect(
      createUpload(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          s3Storage: makeFakeS3Storage(),
          insertPendingFileCommand: makeFakeInsertPendingFile(),
          eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
          songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          ...makeFakePermissionChecks(),
          ...makeFakeQuotaPorts({
            getOrganizationStorageUsage: async () => planCatalog.free.limits.storageBytes - 100,
          }),
        },
        { ...baseInput, sizeBytes: 101 },
      ),
    ).rejects.toBeInstanceOf(QuotaExceededError);
  });

  it("allows an upload that lands exactly on the storage quota", async () => {
    const result = await createUpload(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        s3Storage: makeFakeS3Storage(),
        insertPendingFileCommand: makeFakeInsertPendingFile(),
        eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
        songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
        getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
        ...makeFakePermissionChecks(),
        ...makeFakeQuotaPorts({
          getOrganizationStorageUsage: async () => planCatalog.free.limits.storageBytes - 100,
        }),
      },
      { ...baseInput, sizeBytes: 100 },
    );

    expect(result.uploadUrl).toContain("https://fake-s3.local/");
  });

  it("issues no upload url when the quota rejects the request", async () => {
    const issued: string[] = [];
    const s3Storage = makeFakeS3Storage();
    const trackingS3 = {
      ...s3Storage,
      createUploadUrl: async (args: {
        key: string;
        contentType: string;
        contentLength: number;
      }) => {
        issued.push(args.key);
        return s3Storage.createUploadUrl(args);
      },
    };

    await expect(
      createUpload(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          s3Storage: trackingS3,
          insertPendingFileCommand: makeFakeInsertPendingFile(),
          eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
          songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
          getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
          ...makeFakePermissionChecks(),
          ...makeFakeQuotaPorts({
            getOrganizationStorageUsage: async () => planCatalog.free.limits.storageBytes,
          }),
        },
        { ...baseInput, sizeBytes: 1 },
      ),
    ).rejects.toBeInstanceOf(QuotaExceededError);

    expect(issued).toEqual([]);
  });

  describe("raw previews", () => {
    const deps = () => ({
      db: makeFakeDb(),
      findFolderByIdQuery: makeFakeFindFolderById(),
      s3Storage: makeFakeS3Storage(),
      insertPendingFileCommand: makeFakeInsertPendingFile(),
      eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
      songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
      getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
      ...makeFakePermissionChecks(),
      ...makeFakeQuotaPorts(),
    });

    it("issues a preview upload url next to a raw file", async () => {
      const result = await createUpload(deps(), {
        ...baseInput,
        mimeType: "image/x-sony-arw",
        filename: "photo.arw",
        previewSizeBytes: 512,
      });

      expect(result.previewUploadUrl).toMatch(/photo\.arw\.preview\.jpg$/);
    });

    it("issues no preview upload url for other files", async () => {
      const result = await createUpload(deps(), { ...baseInput, previewSizeBytes: 512 });

      expect(result.previewUploadUrl).toBeNull();
    });

    const raw = { ...baseInput, mimeType: "image/x-sony-arw", filename: "photo.arw" };

    it("leaves the preview out of the storage quota check", async () => {
      const result = await createUpload(
        {
          ...deps(),
          ...makeFakeQuotaPorts({
            getOrganizationStorageUsage: async () =>
              planCatalog.free.limits.storageBytes - raw.sizeBytes,
          }),
        },
        { ...raw, previewSizeBytes: 512 },
      );

      expect(result.previewUploadUrl).toMatch(/photo\.arw\.preview\.jpg$/);
    });

    it("accepts a preview at the size cap", async () => {
      const result = await createUpload(deps(), { ...raw, previewSizeBytes: MAX_PREVIEW_BYTES });

      expect(result.previewUploadUrl).toMatch(/photo\.arw\.preview\.jpg$/);
    });

    it("still uploads the raw file without a preview over the size cap", async () => {
      const result = await createUpload(deps(), {
        ...raw,
        previewSizeBytes: MAX_PREVIEW_BYTES + 1,
      });

      expect(result.uploadUrl).toContain("https://fake-s3.local/");
      expect(result.previewUploadUrl).toBeNull();
    });
  });

  describe("thumbnails", () => {
    const deps = (overrides: Parameters<typeof makeFakeQuotaPorts>[0] = {}) => ({
      db: makeFakeDb(),
      findFolderByIdQuery: makeFakeFindFolderById(),
      s3Storage: makeFakeS3Storage(),
      insertPendingFileCommand: makeFakeInsertPendingFile(),
      eventExistsInOrganizationQuery: makeFakeEventExistsInOrganization(),
      songExistsInOrganizationQuery: makeFakeSongExistsInOrganization(),
      getPersonalOrganizationId: makeFakePersonalOrganizationId("personal-org-1"),
      ...makeFakePermissionChecks(),
      ...makeFakeQuotaPorts(overrides),
    });
    const image = { ...baseInput, mimeType: "image/png", filename: "photo.png" };

    it("issues a thumbnail upload URL for images and videos", async () => {
      const photo = await createUpload(deps(), { ...image, thumbnailSizeBytes: 2048 });
      const video = await createUpload(deps(), {
        ...baseInput,
        mimeType: "video/mp4",
        filename: "clip.mp4",
        thumbnailSizeBytes: 2048,
      });

      expect(photo.thumbnailUploadUrl).toMatch(/photo\.png\.thumbnail\.jpg$/);
      expect(video.thumbnailUploadUrl).toMatch(/clip\.mp4\.thumbnail\.jpg$/);
    });

    it("issues no thumbnail URL without a thumbnail size", async () => {
      const result = await createUpload(deps(), image);

      expect(result.thumbnailUploadUrl).toBeNull();
    });

    it("issues no thumbnail URL for audio", async () => {
      const result = await createUpload(deps(), { ...baseInput, thumbnailSizeBytes: 2048 });

      expect(result.thumbnailUploadUrl).toBeNull();
    });

    it("leaves the thumbnail out of the quota check", async () => {
      const result = await createUpload(
        deps({
          getOrganizationStorageUsage: async () =>
            planCatalog.free.limits.storageBytes - image.sizeBytes,
        }),
        { ...image, thumbnailSizeBytes: 2048 },
      );

      expect(result.thumbnailUploadUrl).not.toBeNull();
    });
  });
});
