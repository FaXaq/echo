import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@echo/errors";
import { confirmUpload } from "./confirm-upload.js";
import { makeFakeFileRepo, makeFakeS3Storage } from "./test-fixtures.js";

const pendingFile = {
  id: "file-1",
  eventId: null,
  organizationId: null,
  uploadedBy: "user-1",
  kind: "audio" as const,
  mimeType: "audio/mpeg",
  sizeBytes: 1024,
  originalFilename: "demo.mp3",
  s3Key: "personal/user-1/file-1/demo.mp3",
  status: "pending" as const,
};

describe("confirmUpload", () => {
  it("marks the file uploaded when the object exists in storage", async () => {
    const fileRepo = makeFakeFileRepo([pendingFile]);
    const s3Storage = makeFakeS3Storage([pendingFile.s3Key]);

    const result = await confirmUpload({ db: {} as never, fileRepo, s3Storage }, { id: "file-1" });

    expect(result.status).toBe("uploaded");
  });

  it("throws when the object never landed in storage", async () => {
    const fileRepo = makeFakeFileRepo([pendingFile]);
    const s3Storage = makeFakeS3Storage([]);

    await expect(
      confirmUpload({ db: {} as never, fileRepo, s3Storage }, { id: "file-1" }),
    ).rejects.toBeInstanceOf(ConflictError);

    const stillPending = await fileRepo.findById({} as never, "file-1");
    expect(stillPending?.status).toBe("pending");
  });

  it("throws NotFoundError for an unknown file id", async () => {
    await expect(
      confirmUpload(
        { db: {} as never, fileRepo: makeFakeFileRepo(), s3Storage: makeFakeS3Storage() },
        { id: "missing" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
