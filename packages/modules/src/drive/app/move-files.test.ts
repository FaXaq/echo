import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { moveFiles } from "./move-files.js";
import { makeFakeDb, makeFakeFindFolderById, makeFakePermissionChecks } from "./test-fixtures.js";
import type { FolderPlace } from "../domain/index.js";
import type { MoveFilesToFolderCommandPort } from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");
const from: FolderPlace = { kind: "root" };
const input = { ids: ["file-1", "file-2", "file-1"], from, scope };

function makeDeps(overrides: Partial<Parameters<typeof moveFiles>[0]> = {}) {
  const moveFilesToFolderCommand: MoveFilesToFolderCommandPort = vi.fn(async () => true);
  return {
    db: makeFakeDb(),
    findFolderByIdQuery: makeFakeFindFolderById(),
    moveFilesToFolderCommand,
    ...makeFakePermissionChecks(),
    ...overrides,
  };
}

describe("moveFiles", () => {
  it("rejects a member without drive:update permission", async () => {
    const deps = makeDeps(
      makeFakePermissionChecks({
        userHasPermissionInOrganization: async () => ({ success: false, error: null, role: null }),
      }),
    );
    await expect(moveFiles(deps, { ...input, folderId: "folder-1" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws NotFoundError when the target folder doesn't exist in this organization", async () => {
    const deps = makeDeps({ findFolderByIdQuery: makeFakeFindFolderById(null) });
    await expect(moveFiles(deps, { ...input, folderId: "missing" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws NotFoundError when a file isn't placed at the source", async () => {
    const deps = makeDeps({ moveFilesToFolderCommand: async () => false });
    await expect(moveFiles(deps, { ...input, folderId: "folder-1" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("moves the distinct files in one command", async () => {
    const deps = makeDeps();
    await moveFiles(deps, { ...input, folderId: "folder-1" });
    expect(deps.moveFilesToFolderCommand).toHaveBeenCalledWith(expect.anything(), scope, {
      ids: ["file-1", "file-2"],
      from: { kind: "root" },
      folderId: "folder-1",
    });
  });

  it("moves files back to root without checking a folder", async () => {
    const deps = makeDeps({ findFolderByIdQuery: makeFakeFindFolderById(null) });
    await expect(moveFiles(deps, { ...input, folderId: null })).resolves.toBeUndefined();
  });
});
