import { describe, expect, it } from "vitest";
import type { SongRow } from "./map-song.js";
import { toSong } from "./map-song.js";

function makeRow(overrides: Partial<SongRow> = {}): SongRow {
  return {
    id: "song-1",
    title: "Yesterday",
    artist: null,
    bpm: null,
    key: null,
    lyrics: null,
    type: null,
    score: null,
    time_signature: null,
    organization_id: "org-1",
    created_by: "user-1",
    created_by_name: "Test User",
    organization_name: "The Band",
    organization_slug: "the-band",
    updated_by: null,
    created_at: new Date("2026-01-01"),
    updated_at: null,
    ...overrides,
  };
}

describe("toSong", () => {
  it("maps a null type to null", () => {
    expect(toSong(makeRow({ type: null })).type).toBeNull();
  });

  it("parses a valid stored type", () => {
    expect(toSong(makeRow({ type: "cover" })).type).toBe("cover");
  });

  it("maps time_signature to timeSignature", () => {
    expect(toSong(makeRow({ time_signature: "6/8" })).timeSignature).toBe("6/8");
  });

  it("throws when the stored type is not a known SongType", () => {
    expect(() => toSong(makeRow({ type: "not-a-type" }))).toThrow();
  });
});
