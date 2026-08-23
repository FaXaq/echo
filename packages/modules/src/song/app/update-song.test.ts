import { describe, expect, it } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { UpdateSongCommandPort } from "../infrastructure/update-song.command.port.js";
import { updateSong } from "./update-song.js";

const scope = createOrganizationScope("org-1");

const { db } = makeDbAdapter({
  host: "localhost",
  port: 5432,
  user: "test",
  password: "test",
  name: "test",
});

describe("updateSong", () => {
  it("throws NotFoundError when the song doesn't exist", async () => {
    const updateSongCommand: UpdateSongCommandPort = async () => null;

    await expect(
      updateSong(
        { db, updateSongCommand },
        { id: "missing", scope, userId: "user-1", title: "New Title" },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("defaults omitted optional fields to null", async () => {
    const received: unknown[] = [];
    const updateSongCommand: UpdateSongCommandPort = async (_db, _scope, input) => {
      received.push(input);
      return {
        id: input.id,
        title: input.title,
        artist: input.artist,
        bpm: input.bpm,
        key: input.key,
        lyrics: null,
        type: input.type,
        organization: { id: "org-1", name: "The Band", slug: "the-band" },
        createdAt: new Date("2026-01-01"),
        createdBy: "user-1",
        createdByName: "Test User",
        updatedBy: input.userId,
        updatedAt: new Date("2026-01-02"),
      };
    };

    await updateSong(
      { db, updateSongCommand },
      { id: "song-1", scope, userId: "user-1", title: "New Title" },
    );

    expect(received).toEqual([
      {
        id: "song-1",
        userId: "user-1",
        title: "New Title",
        artist: null,
        bpm: null,
        key: null,
        type: null,
      },
    ]);
  });
});
