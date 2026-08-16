import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { renameFolder } from "./rename-folder.js";
import {
  makeFakeDb,
  makeFakeFindFolderByParentAndName,
  makeFakeFindFolderById,
  makeFakeFolderRecord,
  makeFakePermissionChecks,
} from "./test-fixtures.js";
import type { RenameFolderByIdCommandPort } from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

describe("renameFolder", () => {
  it("rejects a member without file:update permission", async () => {
    const renameFolderByIdCommand: RenameFolderByIdCommandPort = async () => makeFakeFolderRecord();

    await expect(
      renameFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
          renameFolderByIdCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { id: "folder-1", scope, name: "Renamed" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the folder doesn't exist in this organization", async () => {
    const renameFolderByIdCommand: RenameFolderByIdCommandPort = async () => makeFakeFolderRecord();

    await expect(
      renameFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(null),
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
          renameFolderByIdCommand,
          ...makeFakePermissionChecks(),
        },
        { id: "missing", scope, name: "Renamed" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when another sibling folder already has this name", async () => {
    const renameFolderByIdCommand: RenameFolderByIdCommandPort = async () => makeFakeFolderRecord();

    await expect(
      renameFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(makeFakeFolderRecord({ id: "folder-1" })),
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(
            makeFakeFolderRecord({ id: "folder-2" }),
          ),
          renameFolderByIdCommand,
          ...makeFakePermissionChecks(),
        },
        { id: "folder-1", scope, name: "Taken" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("allows renaming to its own current name (self-match is not a conflict)", async () => {
    const renameFolderByIdCommand: RenameFolderByIdCommandPort = vi.fn(async (_db, _scope, input) =>
      makeFakeFolderRecord({ id: input.id, name: input.name }),
    );

    const result = await renameFolder(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(makeFakeFolderRecord({ id: "folder-1" })),
        findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(
          makeFakeFolderRecord({ id: "folder-1" }),
        ),
        renameFolderByIdCommand,
        ...makeFakePermissionChecks(),
      },
      { id: "folder-1", scope, name: "Demos" },
    );

    expect(result.name).toBe("Demos");
  });

  it("renames the folder when permission succeeds", async () => {
    const renameFolderByIdCommand: RenameFolderByIdCommandPort = vi.fn(async (_db, _scope, input) =>
      makeFakeFolderRecord({ id: input.id, name: input.name }),
    );

    const result = await renameFolder(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
        renameFolderByIdCommand,
        ...makeFakePermissionChecks(),
      },
      { id: "folder-1", scope, name: "Renamed" },
    );
    expect(result.name).toBe("Renamed");
  });
});
