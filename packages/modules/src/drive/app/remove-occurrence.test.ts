import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type {
  DeleteOccurrenceCommandPort,
  DeleteOrphanedFilesCommandPort,
} from "../infrastructure/index.js";
import { removeOccurrence } from "./remove-occurrence.js";
import { makeFakeDb, makeFakePermissionChecks, makeFakeS3Storage } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");
const input = { fileId: "file-1", place: { kind: "song", id: "song-1" } as const, scope };

function makeDeps(
  overrides: Partial<{
    deleteOccurrenceCommand: DeleteOccurrenceCommandPort;
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
    deleteOccurrenceCommand: async () => true,
    deleteOrphanedFilesCommand: async () => [],
    ...makeFakePermissionChecks(),
    ...overrides,
  };
}

describe("removeOccurrence", () => {
  it("rejects a member without drive:delete permission", async () => {
    const deps = {
      ...makeDeps(),
      ...makeFakePermissionChecks({
        userHasPermissionInOrganization: async () => ({ success: false, error: null, role: null }),
      }),
    };
    await expect(removeOccurrence(deps, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the occurrence does not exist", async () => {
    const deps = makeDeps({ deleteOccurrenceCommand: async () => false });
    await expect(removeOccurrence(deps, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns deleted: false when other occurrences remain", async () => {
    const deletedKeys: string[] = [];
    const result = await removeOccurrence(makeDeps({}, deletedKeys), input);
    expect(result).toEqual({ deleted: false });
    expect(deletedKeys).toEqual([]);
  });

  it("returns deleted: true and purges when it was the last", async () => {
    const deletedKeys: string[] = [];
    const deps = makeDeps(
      {
        deleteOrphanedFilesCommand: async () => [
          { id: "file-1", s3Key: "org/org-1/file-1/a.mp3", mimeType: "audio/mpeg" },
        ],
      },
      deletedKeys,
    );
    const result = await removeOccurrence(deps, input);
    expect(result).toEqual({ deleted: true });
    expect(deletedKeys).toEqual(["org/org-1/file-1/a.mp3"]);
  });
});
