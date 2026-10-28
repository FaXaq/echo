import { describe, expect, it } from "vitest";
import { makeDbAdapter } from "@echo/db";
import { NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { SongStructure } from "../domain/index.js";
import { toMusicXml } from "../domain/musicxml.js";
import type { GetSongScoreQueryPort } from "../infrastructure/get-song-score.query.port.js";
import { getSongStructure } from "./get-song-structure.js";

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
      kind: "verse",
      name: "Verse",
      repeat: 2,
      time: { beats: 4, beatType: 4 },
      bars: [{ chords: ["C", "G"] }, { chords: ["Am"] }],
      notes: "",
    },
  ],
};

const run = (query: GetSongScoreQueryPort) =>
  getSongStructure({ db, getSongScoreQuery: query }, { scope, songId: "song-1" });

describe("getSongStructure", () => {
  it("throws NotFoundError when the song doesn't exist", async () => {
    await expect(run(async () => null)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns an empty structure when there is no score", async () => {
    await expect(run(async () => ({ title: "T", score: null }))).resolves.toEqual({
      sections: [],
    });
  });

  it("parses the stored score", async () => {
    const score = toMusicXml(structure, { title: "T" });

    const result = await run(async () => ({ title: "T", score }));

    expect(result).toEqual({ sections: [{ ...structure.sections[0], id: "section-1" }] });
  });

  it("rejects a stored score that parses to invalid values", async () => {
    const score = toMusicXml(structure, { title: "T" }).replace('times="2"', 'times="abc"');

    await expect(run(async () => ({ title: "T", score }))).rejects.toThrow();
  });
});
