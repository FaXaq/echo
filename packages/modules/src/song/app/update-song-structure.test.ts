import { describe, expect, it } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { SongStructure } from "../domain/index.js";
import { fromMusicXml } from "../domain/musicxml.js";
import type { GetSongScoreQueryPort } from "../infrastructure/get-song-score.query.port.js";
import type {
  UpdateSongScoreCommandPort,
  UpdateSongScoreInput,
} from "../infrastructure/update-song-score.command.port.js";
import { updateSongStructure } from "./update-song-structure.js";

const scope = createOrganizationScope("org-1");

const { db } = makeDbAdapter({
  host: "localhost",
  port: 5432,
  user: "test",
  password: "test",
  name: "test",
});

const structure: SongStructure = {
  sections: [
    {
      id: "a",
      kind: "chorus",
      name: "Chorus",
      repeat: 2,
      time: { beats: 4, beatType: 4 },
      bars: [{ chords: ["C", "G"] }, { chords: ["Am"] }],
      notes: "",
    },
  ],
};

const found: GetSongScoreQueryPort = async () => ({ title: "Yesterday", score: null });

describe("updateSongStructure", () => {
  it("throws NotFoundError without writing when the song doesn't exist", async () => {
    let called = false;
    const updateSongScoreCommand: UpdateSongScoreCommandPort = async () => {
      called = true;
      return true;
    };

    await expect(
      updateSongStructure(
        { db, getSongScoreQuery: async () => null, updateSongScoreCommand },
        { scope, id: "missing", userId: "user-1", structure },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(called).toBe(false);
  });

  it("throws NotFoundError when the update matches no song", async () => {
    await expect(
      updateSongStructure(
        { db, getSongScoreQuery: found, updateSongScoreCommand: async () => false },
        { scope, id: "song-1", userId: "user-1", structure },
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("saves the structure as MusicXML titled after the song", async () => {
    let received: UpdateSongScoreInput | undefined;
    const updateSongScoreCommand: UpdateSongScoreCommandPort = async (_db, _scope, input) => {
      received = input;
      return true;
    };

    const result = await updateSongStructure(
      { db, getSongScoreQuery: found, updateSongScoreCommand },
      { scope, id: "song-1", userId: "user-1", structure },
    );

    expect(received?.id).toBe("song-1");
    expect(received?.userId).toBe("user-1");
    expect(received?.score).toContain("<work-title>Yesterday</work-title>");
    expect(fromMusicXml(received?.score ?? "")).toEqual({
      sections: [{ ...structure.sections[0], id: "section-1" }],
    });
    expect(result).toBe(structure);
  });
});
