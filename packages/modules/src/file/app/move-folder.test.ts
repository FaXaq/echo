import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { moveFolder } from "./move-folder.js";
import {
  makeFakeDb,
  makeFakeFindFolderByParentAndName,
  makeFakeFindFolderById,
  makeFakeFolderRecord,
  makeFakePermissionChecks,
} from "./test-fixtures.js";
import type {
  FindFolderByIdQueryPort,
  FindFolderDescendantIdsQueryPort,
  MoveFolderCommandPort,
} from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

function makeFindFolderDescendantIds(ids: string[] = []): FindFolderDescendantIdsQueryPort {
  return async () => ids;
}

describe("moveFolder", () => {
  it("rejects a member without file:update permission", async () => {
    const moveFolderCommand: MoveFolderCommandPort = async () => makeFakeFolderRecord();

    await expect(
      moveFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
          findFolderDescendantIdsQuery: makeFindFolderDescendantIds(),
          moveFolderCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { id: "folder-1", scope, parentFolderId: "folder-2" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the folder being moved doesn't exist", async () => {
    const moveFolderCommand: MoveFolderCommandPort = async () => makeFakeFolderRecord();

    await expect(
      moveFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(null),
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
          findFolderDescendantIdsQuery: makeFindFolderDescendantIds(),
          moveFolderCommand,
          ...makeFakePermissionChecks(),
        },
        { id: "missing", scope, parentFolderId: "folder-2" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects moving a folder into itself", async () => {
    const moveFolderCommand: MoveFolderCommandPort = async () => makeFakeFolderRecord();

    await expect(
      moveFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(makeFakeFolderRecord({ id: "folder-1" })),
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
          findFolderDescendantIdsQuery: makeFindFolderDescendantIds(),
          moveFolderCommand,
          ...makeFakePermissionChecks(),
        },
        { id: "folder-1", scope, parentFolderId: "folder-1" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws NotFoundError when the target parent doesn't exist in this organization", async () => {
    const moveFolderCommand: MoveFolderCommandPort = async () => makeFakeFolderRecord();
    const findFolderByIdQuery: FindFolderByIdQueryPort = async (_db, _scope, input) =>
      input.id === "folder-1" ? makeFakeFolderRecord({ id: "folder-1" }) : null;

    await expect(
      moveFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery,
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
          findFolderDescendantIdsQuery: makeFindFolderDescendantIds(),
          moveFolderCommand,
          ...makeFakePermissionChecks(),
        },
        { id: "folder-1", scope, parentFolderId: "missing-parent" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects moving a folder into one of its own descendants", async () => {
    const moveFolderCommand: MoveFolderCommandPort = async () => makeFakeFolderRecord();
    const findFolderByIdQuery: FindFolderByIdQueryPort = async (_db, _scope, input) =>
      makeFakeFolderRecord({ id: input.id });

    await expect(
      moveFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery,
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
          findFolderDescendantIdsQuery: makeFindFolderDescendantIds(["folder-2", "folder-3"]),
          moveFolderCommand,
          ...makeFakePermissionChecks(),
        },
        { id: "folder-1", scope, parentFolderId: "folder-3" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("throws ConflictError when the destination already has a folder with this name", async () => {
    const moveFolderCommand: MoveFolderCommandPort = async () => makeFakeFolderRecord();
    const findFolderByIdQuery: FindFolderByIdQueryPort = async (_db, _scope, input) =>
      makeFakeFolderRecord({ id: input.id });

    await expect(
      moveFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery,
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(
            makeFakeFolderRecord({ id: "other-folder" }),
          ),
          findFolderDescendantIdsQuery: makeFindFolderDescendantIds(),
          moveFolderCommand,
          ...makeFakePermissionChecks(),
        },
        { id: "folder-1", scope, parentFolderId: "folder-2" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("moves the folder when all checks pass", async () => {
    const moveFolderCommand: MoveFolderCommandPort = vi.fn(async (_db, _scope, input) =>
      makeFakeFolderRecord({ id: input.id, parentFolderId: input.parentFolderId }),
    );
    const findFolderByIdQuery: FindFolderByIdQueryPort = async (_db, _scope, input) =>
      makeFakeFolderRecord({ id: input.id });

    const result = await moveFolder(
      {
        db: makeFakeDb(),
        findFolderByIdQuery,
        findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
        findFolderDescendantIdsQuery: makeFindFolderDescendantIds(),
        moveFolderCommand,
        ...makeFakePermissionChecks(),
      },
      { id: "folder-1", scope, parentFolderId: "folder-2" },
    );

    expect(result.parentFolderId).toBe("folder-2");
  });

  it("allows moving to root (null parent)", async () => {
    const moveFolderCommand: MoveFolderCommandPort = vi.fn(async (_db, _scope, input) =>
      makeFakeFolderRecord({ id: input.id, parentFolderId: input.parentFolderId }),
    );

    const result = await moveFolder(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(makeFakeFolderRecord({ id: "folder-1" })),
        findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
        findFolderDescendantIdsQuery: makeFindFolderDescendantIds(),
        moveFolderCommand,
        ...makeFakePermissionChecks(),
      },
      { id: "folder-1", scope, parentFolderId: null },
    );

    expect(result.parentFolderId).toBeNull();
  });
});
