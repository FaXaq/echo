import { describe, expect, it } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { ConflictError, ForbiddenError, NotFoundError } from "@echo/errors";
import type { FileRecord } from "@echo/modules/drive/domain";
import type {
  FindFileByIdQueryPort,
  SetSongFileRoleCommandPort,
  SetSongFileRoleInput,
} from "@echo/modules/drive/infrastructure";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { setSongAudioVersion } from "./set-song-audio-version.js";

const scope = createOrganizationScope("org-1");

const { db } = makeDbAdapter({
  host: "localhost",
  port: 5432,
  user: "test",
  password: "test",
  name: "test",
});

function makeFakeFile(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: "file-1",
    eventId: null,
    eventTitle: null,
    folderId: null,
    organizationId: "org-1",
    uploadedBy: "user-1",
    uploadedByName: "Test User",
    kind: "audio",
    mimeType: "audio/mpeg",
    sizeBytes: 100,
    filename: "demo.mp3",
    originalFilename: "demo.mp3",
    s3Key: "org/org-1/file-1/demo.mp3",
    status: "uploaded",
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function makeFakeFindFileById(file: FileRecord | null): FindFileByIdQueryPort {
  return async () => file;
}

const baseInput = { songId: "song-1", fileId: "file-1", role: "demo" as const, userId: "user-1" };

describe("setSongAudioVersion", () => {
  it("throws ForbiddenError when the user lacks drive:update", async () => {
    await expect(
      setSongAudioVersion(
        {
          db,
          userHasPermissionInOrganization: async () => ({
            success: false,
            error: null,
            role: null,
          }),
          findFileByIdQuery: makeFakeFindFileById(makeFakeFile()),
          setSongFileRoleCommand: async () => true,
        },
        { ...baseInput, scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the file doesn't exist", async () => {
    await expect(
      setSongAudioVersion(
        {
          db,
          userHasPermissionInOrganization: async () => ({
            success: true,
            error: null,
            role: null,
          }),
          findFileByIdQuery: makeFakeFindFileById(null),
          setSongFileRoleCommand: async () => true,
        },
        { ...baseInput, scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when the file isn't an audio file", async () => {
    await expect(
      setSongAudioVersion(
        {
          db,
          userHasPermissionInOrganization: async () => ({
            success: true,
            error: null,
            role: null,
          }),
          findFileByIdQuery: makeFakeFindFileById(makeFakeFile({ kind: "image" })),
          setSongFileRoleCommand: async () => true,
        },
        { ...baseInput, scope },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws NotFoundError when the file isn't linked to this song", async () => {
    await expect(
      setSongAudioVersion(
        {
          db,
          userHasPermissionInOrganization: async () => ({
            success: true,
            error: null,
            role: null,
          }),
          findFileByIdQuery: makeFakeFindFileById(makeFakeFile()),
          setSongFileRoleCommand: async () => false,
        },
        { ...baseInput, scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("tags the file with the requested role on success", async () => {
    const calls: SetSongFileRoleInput[] = [];
    const setSongFileRoleCommand: SetSongFileRoleCommandPort = async (_db, _scope, input) => {
      calls.push(input);
      return true;
    };

    await setSongAudioVersion(
      {
        db,
        userHasPermissionInOrganization: async () => ({ success: true, error: null, role: null }),
        findFileByIdQuery: makeFakeFindFileById(makeFakeFile()),
        setSongFileRoleCommand,
      },
      { ...baseInput, scope },
    );

    expect(calls).toEqual([
      { songId: "song-1", fileId: "file-1", role: "demo", linkedBy: "user-1" },
    ]);
  });
});
