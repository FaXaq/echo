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
import type { SystemFolderEntry } from "../domain/index.js";
import type { ListFolderContentsQueryPort } from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

describe("listFolderContents", () => {
  it("rejects a member without drive:read permission", async () => {
    const listFolderContentsQuery: ListFolderContentsQueryPort = async () => ({
      folders: [],
      systemFolders: [],
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
        { scope, location: { kind: "root" }, sort: { field: "name", order: "asc" } },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the requested folder doesn't exist in this organization", async () => {
    const listFolderContentsQuery: ListFolderContentsQueryPort = async () => ({
      folders: [],
      systemFolders: [],
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
        {
          scope,
          location: { kind: "folder", id: "missing" },
          sort: { field: "name", order: "asc" },
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns folders and only uploaded files", async () => {
    const listFolderContentsQuery: ListFolderContentsQueryPort = async () => ({
      folders: [{ ...makeFakeFolderRecord(), sizeBytes: 0 }],
      systemFolders: [],
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
      { scope, location: { kind: "root" }, sort: { field: "name", order: "asc" } },
    );

    expect(result.folders).toHaveLength(1);
    expect(result.files).toEqual([expect.objectContaining({ id: "file-1" })]);
  });

  it("passes the sort input through to the query", async () => {
    let receivedInput: unknown;
    const listFolderContentsQuery: ListFolderContentsQueryPort = async (_db, _scope, input) => {
      receivedInput = input;
      return { folders: [], systemFolders: [], files: [] };
    };

    await listFolderContents(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        listFolderContentsQuery,
        ...makeFakePermissionChecks(),
      },
      { scope, location: { kind: "root" }, sort: { field: "name", order: "asc" } },
    );

    expect(receivedInput).toEqual({
      location: { kind: "root" },
      sort: { field: "name", order: "asc" },
    });
  });

  it("returns the folders and system folders of the query with their sizes at the root", async () => {
    const systemFolders: SystemFolderEntry[] = [
      { location: { kind: "events" }, name: "Events", sizeBytes: 700 },
      { location: { kind: "songs" }, name: "Songs", sizeBytes: 30 },
    ];
    const listFolderContentsQuery: ListFolderContentsQueryPort = async () => ({
      folders: [{ ...makeFakeFolderRecord(), sizeBytes: 2048 }],
      systemFolders,
      files: [],
    });

    const result = await listFolderContents(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        listFolderContentsQuery,
        ...makeFakePermissionChecks(),
      },
      { scope, location: { kind: "root" }, sort: { field: "name", order: "desc" } },
    );

    expect(result.systemFolders).toEqual(systemFolders);
    expect(result.folders).toEqual([expect.objectContaining({ sizeBytes: 2048 })]);
  });

  it("returns the system folders of the query below the Events root", async () => {
    const eventFolder: SystemFolderEntry = {
      location: { kind: "event", id: "event-1" },
      name: "2026-01-01 · Gig",
      sizeBytes: 12,
    };
    const listFolderContentsQuery: ListFolderContentsQueryPort = async () => ({
      folders: [],
      systemFolders: [eventFolder],
      files: [],
    });

    const result = await listFolderContents(
      {
        db: makeFakeDb(),
        findFolderByIdQuery: makeFakeFindFolderById(),
        listFolderContentsQuery,
        ...makeFakePermissionChecks(),
      },
      { scope, location: { kind: "events" }, sort: { field: "name", order: "asc" } },
    );

    expect(result.systemFolders).toEqual([eventFolder]);
  });
});
