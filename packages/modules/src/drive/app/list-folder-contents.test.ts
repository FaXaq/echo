import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { listFolderContents } from "./list-folder-contents.js";
import {
  makeFakeDb,
  makeFakeFileRecord,
  makeFakeFindFolderById,
  makeFakeFolderRecord,
  makeFakePermissionChecks,
} from "./test-fixtures.js";
import type { ListFolderContentsQueryPort } from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

describe("listFolderContents", () => {
  it("rejects a member without drive:read permission", async () => {
    const listFolderContentsQuery: ListFolderContentsQueryPort = async () => ({
      folders: [],
      files: [],
    });

    await expect(
      listFolderContents(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(),
          listFolderContentsQuery,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { scope, folderId: null, sort: { field: "name", order: "asc" } },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the requested folder doesn't exist in this organization", async () => {
    const listFolderContentsQuery: ListFolderContentsQueryPort = async () => ({
      folders: [],
      files: [],
    });

    await expect(
      listFolderContents(
        {
          db: makeFakeDb(),
          findFolderByIdQuery: makeFakeFindFolderById(null),
          listFolderContentsQuery,
          ...makeFakePermissionChecks(),
        },
        { scope, folderId: "missing", sort: { field: "name", order: "asc" } },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns folders and only uploaded files", async () => {
    const listFolderContentsQuery: ListFolderContentsQueryPort = async () => ({
      folders: [makeFakeFolderRecord()],
      files: [
        makeFakeFileRecord({ id: "file-1", status: "uploaded" }),
        makeFakeFileRecord({ id: "file-2", status: "pending" }),
      ],
    });

    const result = await listFolderContents(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        listFolderContentsQuery,
        ...makeFakePermissionChecks(),
      },
      { scope, folderId: null, sort: { field: "name", order: "asc" } },
    );

    expect(result.folders).toHaveLength(1);
    expect(result.files).toEqual([expect.objectContaining({ id: "file-1" })]);
  });

  it("passes the sort input through to the query", async () => {
    let receivedInput: unknown;
    const listFolderContentsQuery: ListFolderContentsQueryPort = async (_db, _scope, input) => {
      receivedInput = input;
      return { folders: [], files: [] };
    };

    await listFolderContents(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        listFolderContentsQuery,
        ...makeFakePermissionChecks(),
      },
      { scope, folderId: null, sort: { field: "name", order: "asc" } },
    );

    expect(receivedInput).toEqual({ folderId: null, sort: { field: "name", order: "asc" } });
  });
});
