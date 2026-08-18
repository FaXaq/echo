import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { searchDrive } from "./search-drive.js";
import {
  makeFakeDb,
  makeFakeFileRecord,
  makeFakeFolderRecord,
  makeFakePermissionChecks,
} from "./test-fixtures.js";
import type { SearchDriveQueryPort } from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

describe("searchDrive", () => {
  it("rejects a member without drive:read permission", async () => {
    const searchDriveQuery: SearchDriveQueryPort = async () => ({ folders: [], files: [] });

    await expect(
      searchDrive(
        {
          db: makeFakeDb(),
          searchDriveQuery,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { scope, query: "demo" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns matched folders and files with their location path", async () => {
    const searchDriveQuery: SearchDriveQueryPort = async () => ({
      folders: [{ ...makeFakeFolderRecord({ name: "Demos" }), path: ["Songs"] }],
      files: [{ ...makeFakeFileRecord({ id: "file-1" }), path: ["Songs", "Demos"] }],
    });

    const result = await searchDrive(
      { db: makeFakeDb(), searchDriveQuery, ...makeFakePermissionChecks() },
      { scope, query: "demo" },
    );

    expect(result.folders).toEqual([expect.objectContaining({ name: "Demos", path: ["Songs"] })]);
    expect(result.files).toEqual([
      expect.objectContaining({ id: "file-1", path: ["Songs", "Demos"] }),
    ]);
  });
});
