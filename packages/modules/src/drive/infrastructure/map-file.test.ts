import { describe, expect, it } from "vitest";
import type { FileRow, SongFileRow } from "./map-file.js";
import { toFileRecord, toSongFileRecord } from "./map-file.js";

function makeRow(overrides: Partial<FileRow> = {}): FileRow {
  return {
    id: "file-1",
    event_id: null,
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

function makeSongFileRow(overrides: Partial<SongFileRow> = {}): SongFileRow {
  return {
    ...makeRow(),
    role: null,
    version: null,
    linked_at: new Date("2026-01-02"),
    linked_by: "user-1",
    ...overrides,
  };
}

describe("toFileRecord", () => {
  it("throws when the stored kind is unknown", () => {
    expect(() => toFileRecord(makeRow({ kind: "not-a-kind" }))).toThrow();
  });

  it("throws when the stored status is unknown", () => {
    expect(() => toFileRecord(makeRow({ status: "not-a-status" }))).toThrow();
  });
});

describe("toSongFileRecord", () => {
  it("maps a null role through", () => {
    expect(toSongFileRecord(makeSongFileRow({ role: null })).role).toBeNull();
  });

  it("maps a set role and version through", () => {
    const record = toSongFileRecord(makeSongFileRow({ role: "demo", version: 2 }));
    expect(record.role).toBe("demo");
    expect(record.version).toBe(2);
  });

  it("throws when the stored role is unknown", () => {
    expect(() => toSongFileRecord(makeSongFileRow({ role: "not-a-role" }))).toThrow();
  });
});
