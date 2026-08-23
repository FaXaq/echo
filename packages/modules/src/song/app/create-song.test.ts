import { describe, expect, it } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { InsertSongCommandPort } from "../infrastructure/insert-song.command.port.js";
import type { Song } from "../domain/index.js";
import { createSong } from "./create-song.js";

const scope = createOrganizationScope("org-1");

const { db } = makeDbAdapter({
  host: "localhost",
  port: 5432,
  user: "test",
  password: "test",
  name: "test",
});

function makeFakeSong(overrides: Partial<Song> = {}): Song {
  return {
    id: "song-1",
    title: "Yesterday",
    artist: null,
    bpm: null,
    key: null,
    lyrics: null,
    type: null,
    organization: { id: "org-1", name: "The Band", slug: "the-band" },
    createdAt: new Date("2026-01-01"),
    createdBy: "user-1",
    createdByName: "Test User",
    updatedBy: null,
    updatedAt: null,
    ...overrides,
  };
}

describe("createSong", () => {
  it("inserts a song with only title set and defaults the rest to null", async () => {
    const inserted: unknown[] = [];
    const insertSongCommand: InsertSongCommandPort = async (_db, _scope, input) => {
      inserted.push(input);
      return makeFakeSong({ title: input.title });
    };

    const result = await createSong(
      { db, insertSongCommand },
      { scope, userId: "user-1", title: "Yesterday" },
    );

    expect(inserted).toEqual([
      {
        id: expect.any(String),
        userId: "user-1",
        title: "Yesterday",
        artist: null,
        bpm: null,
        key: null,
        type: null,
      },
    ]);
    expect(result.title).toBe("Yesterday");
  });

  it("passes through optional fields when provided", async () => {
    const inserted: unknown[] = [];
    const insertSongCommand: InsertSongCommandPort = async (_db, _scope, input) => {
      inserted.push(input);
      return makeFakeSong();
    };

    await createSong(
      { db, insertSongCommand },
      {
        scope,
        userId: "user-1",
        title: "Yesterday",
        artist: "The Beatles",
        bpm: 120,
        key: "F",
        type: "cover",
      },
    );

    expect(inserted).toEqual([
      {
        id: expect.any(String),
        userId: "user-1",
        title: "Yesterday",
        artist: "The Beatles",
        bpm: 120,
        key: "F",
        type: "cover",
      },
    ]);
  });
});
