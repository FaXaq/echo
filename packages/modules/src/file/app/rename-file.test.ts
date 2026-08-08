import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@echo/errors";
import { renameFile } from "./rename-file.js";
import { makeFakePermissionChecks } from "./test-fixtures.js";
import * as infra from "../infrastructure/index.js";

function stubFile(file: { organizationId: string | null; uploadedBy: string } | null) {
  vi.spyOn(infra, "findFileById").mockResolvedValue(
    file
      ? {
          id: "f1",
          eventId: null,
          organizationId: file.organizationId,
          uploadedBy: file.uploadedBy,
          uploadedByName: file.uploadedBy,
          kind: "document",
          mimeType: "application/pdf",
          sizeBytes: 100,
          originalFilename: "old.pdf",
          filename: "old.pdf",
          s3Key: "key",
          status: "uploaded",
        }
      : null,
  );
}

describe("renameFile", () => {
  it("throws NotFoundError when the file doesn't exist", async () => {
    stubFile(null);
    await expect(
      renameFile(
        { db: {} as never, ...makeFakePermissionChecks() },
        { id: "missing", userId: "user-1", filename: "new.pdf" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("allows the owner to rename their own organization file without an explicit permission check", async () => {
    stubFile({ organizationId: "org-1", uploadedBy: "user-1" });
    vi.spyOn(infra, "renameFileById").mockResolvedValue({
      id: "f1",
      eventId: null,
      organizationId: "org-1",
      uploadedBy: "user-1",
      uploadedByName: "user-1",
      kind: "document",
      mimeType: "application/pdf",
      sizeBytes: 100,
      originalFilename: "renamed.pdf",
      filename: "old.pdf",
      s3Key: "key",
      status: "uploaded",
    });

    const result = await renameFile(
      {
        db: {} as never,
        ...makeFakePermissionChecks({
          userHasPermissionInOrganization: async () => ({ success: false, error: null, role: null }),
        }),
      },
      { id: "f1", userId: "user-1", filename: "renamed.pdf" },
    );
    expect(result.filename).toBe("renamed.pdf");
  });

  it("rejects a non-owner organization member without file:update permission", async () => {
    stubFile({ organizationId: "org-1", uploadedBy: "someone-else" });

    await expect(
      renameFile(
        {
          db: {} as never,
          ...makeFakePermissionChecks({
            userHasPermissionInOrganization: async () => ({ success: false, error: null, role: null }),
          }),
        },
        { id: "f1", userId: "user-1", filename: "renamed.pdf" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects a personal-file owner without selfUpdate permission", async () => {
    stubFile({ organizationId: null, uploadedBy: "user-1" });

    await expect(
      renameFile(
        {
          db: {} as never,
          ...makeFakePermissionChecks({
            userHasPermission: async () => ({ success: false, error: null }),
          }),
        },
        { id: "f1", userId: "user-1", filename: "renamed.pdf" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
