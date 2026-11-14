import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { previewFolderDelete } from "./preview-folder-delete.js";
import { makeFakeDb, makeFakeFindFolderById, makeFakePermissionChecks } from "./test-fixtures.js";
import type { PreviewFolderDeleteQueryPort } from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");
const previewFolderDeleteQuery: PreviewFolderDeleteQueryPort = async () => ({
  deletedCount: 2,
  keptCount: 1,
});

describe("previewFolderDelete", () => {
  it("rejects a member without drive:delete permission", async () => {
    await expect(
      previewFolderDelete(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          previewFolderDeleteQuery,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { scope, id: "folder-1" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the folder doesn't exist", async () => {
    await expect(
      previewFolderDelete(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(null),
          previewFolderDeleteQuery,
          ...makeFakePermissionChecks(),
        },
        { scope, id: "missing" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns the counts given by the query", async () => {
    const result = await previewFolderDelete(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        previewFolderDeleteQuery,
        ...makeFakePermissionChecks(),
      },
      { scope, id: "folder-1" },
    );

    expect(result).toEqual({ deletedCount: 2, keptCount: 1 });
  });
});
