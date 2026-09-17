import { describe, expect, it } from "vitest";
import type { SongFileRecord } from "@echo/modules/drive/domain";
import { selectDefaultSongFile } from "./index.js";

function makeFile(overrides: Partial<SongFileRecord> = {}): SongFileRecord {
  return {
    id: "file-1",
    eventId: null,
    eventTitle: null,
    folderId: null,
    organizationId: "org-1",
    uploadedBy: "user-1",
    uploadedByName: "Test User",
    kind: "audio",
    mimeType: "audio/mpeg",
    sizeBytes: 100,
    filename: "take.mp3",
    originalFilename: "take.mp3",
    s3Key: "org/org-1/file-1/take.mp3",
    status: "uploaded",
    createdAt: new Date("2026-01-01"),
    updatedAt: null,
    role: null,
    version: null,
    linkedAt: new Date("2026-01-01"),
    linkedBy: "user-1",
    ...overrides,
  };
}

describe("selectDefaultSongFile", () => {
  it("prefers the final take over the demo", () => {
    const demo = makeFile({ id: "demo-1", role: "demo", version: 1 });
    const final = makeFile({ id: "final-1", role: "final", version: 1 });

    expect(selectDefaultSongFile([demo, final])?.id).toBe("final-1");
  });

  it("falls back to the demo when there is no final take", () => {
    const demo = makeFile({ id: "demo-1", role: "demo", version: 1 });

    expect(selectDefaultSongFile([demo])?.id).toBe("demo-1");
  });

  it("returns null when there is no demo or final take", () => {
    expect(selectDefaultSongFile([])).toBeNull();
  });
});
