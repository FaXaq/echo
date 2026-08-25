import { describe, expect, it } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { UpdateSongLyricsCommandPort } from "../infrastructure/update-song-lyrics.command.port.js";
import type { Song } from "../domain/index.js";
import { updateSongLyrics } from "./update-song-lyrics.js";

const scope = createOrganizationScope("org-1");

const { db } = makeDbAdapter({
  host: "localhost",
  port: 5432,
  user: "test",
  password: "test",
  name: "test",
});

function makeFakeSong(lyrics: string | null): Song {
  return {
    id: "song-1",
    title: "Yesterday",
    artist: null,
    bpm: null,
    key: null,
    lyrics,
    type: null,
    organization: { id: "org-1", name: "The Band", slug: "the-band" },
    createdAt: new Date("2026-01-01"),
    createdBy: "user-1",
    createdByName: "Test User",
    updatedBy: null,
    updatedAt: null,
  };
}

describe("updateSongLyrics", () => {
  it("throws NotFoundError when the song doesn't exist", async () => {
    const updateSongLyricsCommand: UpdateSongLyricsCommandPort = async () => null;

    await expect(
      updateSongLyrics(
        { db, updateSongLyricsCommand },
        { id: "missing", scope, userId: "user-1", lyrics: "# Verse" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("saves the given lyrics", async () => {
    let received: { id: string; userId: string; lyrics: string | null } | undefined;
    const updateSongLyricsCommand: UpdateSongLyricsCommandPort = async (_db, _scope, input) => {
      received = input;
      return makeFakeSong(input.lyrics);
    };

    const result = await updateSongLyrics(
      { db, updateSongLyricsCommand },
      { id: "song-1", scope, userId: "user-1", lyrics: "# Verse 1" },
    );

    expect(received).toEqual({ id: "song-1", userId: "user-1", lyrics: "# Verse 1" });
    expect(result.lyrics).toBe("# Verse 1");
  });
});
