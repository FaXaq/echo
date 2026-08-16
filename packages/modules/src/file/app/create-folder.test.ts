import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { createFolder } from "./create-folder.js";
import {
  makeFakeDb,
  makeFakeFindFolderByParentAndName,
  makeFakeFindFolderById,
  makeFakeFolderRecord,
  makeFakePermissionChecks,
} from "./test-fixtures.js";
import type { InsertFolderCommandPort } from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

describe("createFolder", () => {
  it("rejects a member without file:create permission", async () => {
    const insertFolderCommand: InsertFolderCommandPort = async () => makeFakeFolderRecord();

    await expect(
      createFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
          insertFolderCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { scope, parentFolderId: null, name: "Demos" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the parent folder doesn't exist in this organization", async () => {
    const insertFolderCommand: InsertFolderCommandPort = async () => makeFakeFolderRecord();

    await expect(
      createFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(null),
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
          insertFolderCommand,
          ...makeFakePermissionChecks(),
        },
        { scope, parentFolderId: "missing-parent", name: "Demos" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when a sibling folder already has this name", async () => {
    const insertFolderCommand: InsertFolderCommandPort = async () => makeFakeFolderRecord();

    await expect(
      createFolder(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(makeFakeFolderRecord()),
          insertFolderCommand,
          ...makeFakePermissionChecks(),
        },
        { scope, parentFolderId: null, name: "Demos" },
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("creates the folder when permission succeeds and the name is free", async () => {
    const insertFolderCommand: InsertFolderCommandPort = vi.fn(async (_db, _scope, input) =>
      makeFakeFolderRecord({
        id: input.id,
        parentFolderId: input.parentFolderId,
        name: input.name,
      }),
    );

    const result = await createFolder(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        findFolderByParentAndNameQuery: makeFakeFindFolderByParentAndName(),
        insertFolderCommand,
        ...makeFakePermissionChecks(),
      },
      { scope, parentFolderId: null, name: "Demos" },
    );

    expect(result.name).toBe("Demos");
    expect(insertFolderCommand).toHaveBeenCalledOnce();
  });
});
