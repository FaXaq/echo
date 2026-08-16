import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { renameFile } from "./rename-file.js";
import { makeFakePermissionChecks } from "./test-fixtures.js";
import * as infra from "../infrastructure/index.js";

const scope = createOrganizationScope("org-1");

describe("renameFile", () => {
  it("rejects a member without file:update permission", async () => {
    await expect(
      renameFile(
        {
          db: {} as never,
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
    vi.spyOn(infra, "renameFileById").mockResolvedValue(null);

    await expect(
      renameFile(
        { db: {} as never, ...makeFakePermissionChecks() },
        { id: "missing", scope, filename: "renamed.pdf" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("renames the file when permission succeeds", async () => {
    vi.spyOn(infra, "renameFileById").mockResolvedValue({
      id: "f1",
      eventId: null,
      organizationId: "org-1",
      uploadedBy: "user-1",
      uploadedByName: "user-1",
      kind: "document",
      mimeType: "application/pdf",
      sizeBytes: 100,
      originalFilename: "old.pdf",
      filename: "renamed.pdf",
      s3Key: "key",
      status: "uploaded",
      createdAt: null,
      updatedAt: null,
    });

    const result = await renameFile(
      { db: {} as never, ...makeFakePermissionChecks() },
      { id: "f1", scope, filename: "renamed.pdf" },
    );
    expect(result.filename).toBe("renamed.pdf");
  });
});
