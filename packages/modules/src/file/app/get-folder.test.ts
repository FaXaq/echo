import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { getFolder } from "./get-folder.js";
import { makeFakeDb, makeFakeFindFolderById, makeFakePermissionChecks } from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

describe("getFolder", () => {
  it("rejects a member without file:read permission", async () => {
    await expect(
      getFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { id: "folder-1", scope },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the folder doesn't exist in this organization", async () => {
    await expect(
      getFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(null),
          ...makeFakePermissionChecks(),
        },
        { id: "missing", scope },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns the folder", async () => {
    const result = await getFolder(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        ...makeFakePermissionChecks(),
      },
      { id: "folder-1", scope },
    );

    expect(result).toEqual(expect.objectContaining({ id: "folder-1" }));
  });
});
