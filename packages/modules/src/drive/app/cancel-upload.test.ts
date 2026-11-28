import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { DeleteFileByIdCommandPort } from "../infrastructure/index.js";
import { cancelUpload } from "./cancel-upload.js";
import {
  makeFakeDb,
  makeFakeFileRecord,
  makeFakeFindFileById,
  makeFakeS3Storage,
} from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

function setup(file = makeFakeFileRecord({ s3Key: "org/org-1/file-1/a.mp3" })) {
  const aborted: string[] = [];
  const deletedKeys: string[] = [];
  const deletedRows: string[] = [];
  const deleteFileByIdCommand: DeleteFileByIdCommandPort = async (_db, _scope, input) => {
    deletedRows.push(input.id);
    return true;
  };
  const deps = {
    db: makeFakeDb(),
    s3Storage: {
      ...makeFakeS3Storage(),
      abortMultipartUpload: async ({ uploadId }: { key: string; uploadId: string }) => {
        aborted.push(uploadId);
        throw new Error("NoSuchUpload");
      },
      deleteObject: async (key: string) => {
        deletedKeys.push(key);
      },
    },
    findFileByIdQuery: makeFakeFindFileById(file),
    deleteFileByIdCommand,
  };
  return { deps, aborted, deletedKeys, deletedRows };
}

describe("cancelUpload", () => {
  it("aborts the multipart upload and deletes objects and row, even if the abort fails", async () => {
    const { deps, aborted, deletedKeys, deletedRows } = setup();

    await cancelUpload(deps, { id: "file-1", userId: "user-1", uploadId: "u-1", scope });

    expect(aborted).toEqual(["u-1"]);
    expect(deletedKeys).toEqual(["org/org-1/file-1/a.mp3"]);
    expect(deletedRows).toEqual(["file-1"]);
  });

  it("refuses to cancel someone else's upload", async () => {
    const { deps, deletedRows } = setup();

    await expect(
      cancelUpload(deps, { id: "file-1", userId: "user-2", scope }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(deletedRows).toEqual([]);
  });

  it("does nothing when the file is already gone", async () => {
    const { deps, deletedRows } = setup();

    await cancelUpload(
      { ...deps, findFileByIdQuery: makeFakeFindFileById(null) },
      { id: "file-1", userId: "user-1", scope },
    );

    expect(deletedRows).toEqual([]);
  });
});
