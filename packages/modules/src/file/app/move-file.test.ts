import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { moveFile } from "./move-file.js";
import {
  makeFakeDb,
  makeFakeFileRecord,
  makeFakeFindFolderById,
  makeFakePermissionChecks,
} from "./test-fixtures.js";
import type { MoveFileToFolderCommandPort } from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

describe("moveFile", () => {
  it("rejects a member without file:update permission", async () => {
    const moveFileToFolderCommand: MoveFileToFolderCommandPort = async () => makeFakeFileRecord();

    await expect(
      moveFile(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          moveFileToFolderCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { id: "file-1", scope, folderId: "folder-1" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the target folder doesn't exist in this organization", async () => {
    const moveFileToFolderCommand: MoveFileToFolderCommandPort = async () => makeFakeFileRecord();

    await expect(
      moveFile(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(null),
          moveFileToFolderCommand,
          ...makeFakePermissionChecks(),
        },
        { id: "file-1", scope, folderId: "missing-folder" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when the file doesn't exist in this organization", async () => {
    const moveFileToFolderCommand: MoveFileToFolderCommandPort = async () => null;

    await expect(
      moveFile(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          moveFileToFolderCommand,
          ...makeFakePermissionChecks(),
        },
        { id: "missing", scope, folderId: "folder-1" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("moves the file into the folder", async () => {
    const moveFileToFolderCommand: MoveFileToFolderCommandPort = vi.fn(async (_db, _scope, input) =>
      makeFakeFileRecord({ id: input.id, folderId: input.folderId }),
    );

    const result = await moveFile(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        moveFileToFolderCommand,
        ...makeFakePermissionChecks(),
      },
      { id: "file-1", scope, folderId: "folder-1" },
    );

    expect(result.folderId).toBe("folder-1");
  });

  it("moves the file back to root without checking a folder", async () => {
    const moveFileToFolderCommand: MoveFileToFolderCommandPort = vi.fn(async (_db, _scope, input) =>
      makeFakeFileRecord({ id: input.id, folderId: input.folderId }),
    );

    const result = await moveFile(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(null),
        moveFileToFolderCommand,
        ...makeFakePermissionChecks(),
      },
      { id: "file-1", scope, folderId: null },
    );

    expect(result.folderId).toBeNull();
  });
});
