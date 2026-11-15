import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { Place } from "../domain/index.js";
import type {
  DeleteOccurrencesCommandPort,
  DeleteOrphanedFilesCommandPort,
} from "../infrastructure/index.js";
import { removeOccurrences } from "./remove-occurrences.js";
import { makeFakeDb, makeFakePermissionChecks, makeFakeS3Storage } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");
const place: Place = { kind: "song", id: "song-1" };
const input = { fileIds: ["file-1", "file-2"], place, scope };
const removeAll: DeleteOccurrencesCommandPort = async (_db, _scope, { fileIds }) => fileIds;

function makeDeps(
  overrides: Partial<{
    deleteOccurrencesCommand: DeleteOccurrencesCommandPort;
    deleteOrphanedFilesCommand: DeleteOrphanedFilesCommandPort;
  }> = {},
  deletedKeys: string[] = [],
) {
  return {
    db: makeFakeDb(),
    s3Storage: {
      ...makeFakeS3Storage(),
      deleteObject: async (key: string) => {
        deletedKeys.push(key);
      },
    },
    deleteOccurrencesCommand: removeAll,
    deleteOrphanedFilesCommand: async () => [],
    ...makeFakePermissionChecks(),
    ...overrides,
  };
}

describe("removeOccurrences", () => {
  it("rejects a member without drive:delete permission", async () => {
    const deps = {
      ...makeDeps(),
      ...makeFakePermissionChecks({
        userHasPermissionInOrganization: async () => ({ success: false, error: null, role: null }),
      }),
    };
    await expect(removeOccurrences(deps, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when none of the occurrences exist", async () => {
    const deps = makeDeps({ deleteOccurrencesCommand: async () => [] });
    await expect(removeOccurrences(deps, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("reports removed files without deleting those placed elsewhere", async () => {
    const deletedKeys: string[] = [];
    const result = await removeOccurrences(makeDeps({}, deletedKeys), input);
    expect(result).toEqual({
      removedFileIds: ["file-1", "file-2"],
      deletedFileIds: [],
      failures: [],
    });
    expect(deletedKeys).toEqual([]);
  });

  it("purges only the files whose last occurrence was removed", async () => {
    const deletedKeys: string[] = [];
    const deps = makeDeps(
      {
        deleteOrphanedFilesCommand: async () => [
          { id: "file-1", s3Key: "org/org-1/file-1/a.mp3", mimeType: "audio/mpeg" },
        ],
      },
      deletedKeys,
    );
    const result = await removeOccurrences(deps, input);
    expect(result).toEqual({
      removedFileIds: ["file-1", "file-2"],
      deletedFileIds: ["file-1"],
      failures: [],
    });
    expect(deletedKeys).toEqual(["org/org-1/file-1/a.mp3"]);
  });

  it("returns purge failures when S3 deletion fails", async () => {
    const error = new Error("s3 down");
    const deps = {
      ...makeDeps({
        deleteOrphanedFilesCommand: async () => [
          { id: "file-1", s3Key: "org/org-1/file-1/a.mp3", mimeType: "audio/mpeg" },
        ],
      }),
      s3Storage: {
        ...makeFakeS3Storage(),
        deleteObject: async () => {
          throw error;
        },
      },
    };
    const result = await removeOccurrences(deps, input);
    expect(result.failures).toEqual([{ fileId: "file-1", error }]);
  });
});
