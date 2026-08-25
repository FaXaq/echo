import { describe, expect, it } from "vitest";
import type { FileRow } from "./map-file.js";
import { toFileRecord } from "./map-file.js";

function makeRow(overrides: Partial<FileRow> = {}): FileRow {
  return {
    id: "file-1",
    event_id: null,
    song_id: null,
    folder_id: null,
    organization_id: "org-1",
    uploaded_by: "user-1",
    uploaded_by_name: "Test User",
    kind: "audio",
    mime_type: "audio/mpeg",
    size_bytes: 100,
    filename: "demo.mp3",
    original_filename: "demo.mp3",
    s3_key: "org/org-1/file-1/demo.mp3",
    status: "uploaded",
    created_at: new Date("2026-01-01"),
    updated_at: null,
    ...overrides,
  };
}

describe("toFileRecord", () => {
  it("maps a null song_id to a null songId", () => {
    expect(toFileRecord(makeRow({ song_id: null })).songId).toBeNull();
  });

  it("maps a set song_id through", () => {
    expect(toFileRecord(makeRow({ song_id: "song-1" })).songId).toBe("song-1");
  });

  it("throws when the stored kind is unknown", () => {
    expect(() => toFileRecord(makeRow({ kind: "not-a-kind" }))).toThrow();
  });

  it("throws when the stored status is unknown", () => {
    expect(() => toFileRecord(makeRow({ status: "not-a-status" }))).toThrow();
  });
});
