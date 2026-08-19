import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { renameFile } from "./rename-file.js";
import { makeFakeDb, makeFakeFileRecord, makeFakePermissionChecks } from "./test-fixtures.js";
import type { RenameFileByIdCommandPort } from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

describe("renameFile", () => {
  it("rejects a member without drive:update permission", async () => {
    const renameFileByIdCommand: RenameFileByIdCommandPort = async () => makeFakeFileRecord();

    await expect(
      renameFile(
        {
          db: makeFakeDb(),
          renameFileByIdCommand,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({
              success: false,
              error: null,
              role: null,
            }),
          }),
        },
        { id: "f1", scope, filename: "renamed.pdf" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError when the file doesn't exist in this organization", async () => {
    const renameFileByIdCommand: RenameFileByIdCommandPort = async () => null;

    await expect(
      renameFile(
        { db: makeFakeDb(), renameFileByIdCommand, ...makeFakePermissionChecks() },
        { id: "missing", scope, filename: "renamed.pdf" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("renames the file when permission succeeds", async () => {
    const renameFileByIdCommand: RenameFileByIdCommandPort = vi.fn(async (_db, _scope, input) =>
      makeFakeFileRecord({ id: input.id, filename: input.filename }),
    );

    const result = await renameFile(
      { db: makeFakeDb(), renameFileByIdCommand, ...makeFakePermissionChecks() },
      { id: "f1", scope, filename: "renamed.pdf" },
    );
    expect(result.filename).toBe("renamed.pdf");
  });
});
