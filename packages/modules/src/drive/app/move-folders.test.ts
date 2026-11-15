import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { moveFolders } from "./move-folders.js";
import { makeFakeDb, makeFakeFolderRecord, makeFakePermissionChecks } from "./test-fixtures.js";
import type {
  FindFolderPathQueryPort,
  FindFoldersByIdsQueryPort,
  FindFoldersByParentAndNamesQueryPort,
  MoveFoldersCommandPort,
} from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

const findFoldersByIdsQuery: FindFoldersByIdsQueryPort = async (_db, _scope, { ids }) =>
  ids.map((id) => makeFakeFolderRecord({ id, name: id }));

const pathTo =
  (...ids: string[]): FindFolderPathQueryPort =>
  async () =>
    ids.map((id) => ({ id, name: id }));

function makeDeps(overrides: Partial<Parameters<typeof moveFolders>[0]> = {}) {
  const moveFoldersCommand: MoveFoldersCommandPort = vi.fn(async () => {});
  const findFoldersByParentAndNamesQuery: FindFoldersByParentAndNamesQueryPort = async () => [];
  return {
    db: makeFakeDb(),
    findFoldersByIdsQuery,
    findFolderPathQuery: pathTo("folder-9"),
    findFoldersByParentAndNamesQuery,
    moveFoldersCommand,
    ...makeFakePermissionChecks(),
    ...overrides,
  };
}

const input = { ids: ["folder-1", "folder-2"], scope, parentFolderId: "folder-9" };

describe("moveFolders", () => {
  it("rejects a member without drive:update permission", async () => {
    const deps = makeDeps(
      makeFakePermissionChecks({
        userHasPermissionInOrganization: async () => ({ success: false, error: null, role: null }),
      }),
    );
    await expect(moveFolders(deps, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when a moved folder doesn't exist", async () => {
    const deps = makeDeps({ findFoldersByIdsQuery: async () => [makeFakeFolderRecord()] });
    await expect(moveFolders(deps, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when the target parent doesn't exist", async () => {
    const deps = makeDeps({ findFolderPathQuery: pathTo() });
    await expect(moveFolders(deps, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects moving a folder into itself", async () => {
    await expect(
      moveFolders(makeDeps(), { ...input, parentFolderId: "folder-2" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects moving a folder into one of its own subfolders", async () => {
    const deps = makeDeps({ findFolderPathQuery: pathTo("folder-1", "child", "folder-9") });
    await expect(moveFolders(deps, input)).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError when the destination already has a folder with a moved name", async () => {
    const deps = makeDeps({
      findFoldersByParentAndNamesQuery: async () => [makeFakeFolderRecord({ id: "other" })],
    });
    await expect(moveFolders(deps, input)).rejects.toBeInstanceOf(ConflictError);
  });

  it("moves all folders in one command when every check passes", async () => {
    const deps = makeDeps();
    await moveFolders(deps, input);
    expect(deps.moveFoldersCommand).toHaveBeenCalledWith(expect.anything(), scope, {
      ids: ["folder-1", "folder-2"],
      parentFolderId: "folder-9",
    });
  });

  it("moves to root without looking up a parent path", async () => {
    const findFolderPathQuery = vi.fn(pathTo());
    const deps = makeDeps({ findFolderPathQuery });
    await moveFolders(deps, { ...input, parentFolderId: null });
    expect(findFolderPathQuery).not.toHaveBeenCalled();
    expect(deps.moveFoldersCommand).toHaveBeenCalled();
  });
});
