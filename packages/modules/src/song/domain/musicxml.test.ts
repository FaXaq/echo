import { describe, expect, it } from "vitest";
import { barDuration, fromMusicXml, toMusicXml } from "./musicxml.js";
import type { SongStructure, TimeSignature } from "./structure.js";

const structure: SongStructure = {
  sections: [
    {
      id: "a",
      kind: "intro",
      name: "Intro",
      repeat: 1,
      time: { beats: 4, beatType: 4 },
      bars: [{ chords: ["Am"] }, { chords: ["F"] }, { chords: ["C"] }, { chords: ["G"] }],
      notes: "",
    },
    {
      id: "b",
      kind: "chorus",
      name: "Chorus",
      repeat: 2,
      time: { beats: 4, beatType: 4 },
      bars: [{ chords: ["F"] }, { chords: ["G"] }, { chords: ["C/E", "G"] }, { chords: [] }],
      notes: "Big",
    },
    {
      id: "c",
      kind: "bridge",
      name: "Bridge",
      repeat: 1,
      time: { beats: 3, beatType: 4 },
      bars: [{ chords: ["Dm"] }, { chords: ["Em"], time: { beats: 2, beatType: 4 } }],
      notes: "",
    },
  ],
};

const ids = (s: SongStructure) => ({
  sections: s.sections.map((x, i) => ({ ...x, id: `section-${i + 1}` })),
});

const score = (measures: string) =>
  `<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>x</part-name></score-part></part-list><part id="P1">${measures}</part>`.concat(
    "</score-partwise>",
  );

const harmony = (step: string) =>
  `<harmony><root><root-step>${step}</root-step></root><kind>major</kind></harmony><forward><duration>96</duration></forward>`;

const MINIMAL_SCORE = score(
  `<measure number="1"><attributes><divisions>24</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>${harmony("C")}</measure>
   <measure number="2">${harmony("G")}</measure>`,
);

describe("musicxml", () => {
  it("round-trips the structure", () => {
    expect(fromMusicXml(toMusicXml(structure, { title: "T" }))).toEqual(ids(structure));
  });

  it("round-trips an empty structure", () => {
    expect(fromMusicXml(toMusicXml({ sections: [] }, { title: "T" }))).toEqual({ sections: [] });
  });

  it("round-trips names, notes and suffixes needing escaping", () => {
    const tricky: SongStructure = {
      sections: [
        {
          ...structure.sections[0],
          name: 'A <b> & "c"',
          notes: "x < y && z > 'w'\nline 2",
          bars: [{ chords: ["C(", "A<"] }],
        },
      ],
    };
    expect(fromMusicXml(toMusicXml(tricky, { title: "T" }))).toEqual(ids(tricky));
  });

  it("writes a MusicXML 4.0 partwise document", () => {
    const xml = toMusicXml(structure, { title: "Midnight <Drive>" });
    expect(xml).toContain('<score-partwise version="4.0">');
    expect(xml).toContain("<work-title>Midnight &lt;Drive&gt;</work-title>");
    expect(xml).toContain("<divisions>24</divisions>");
  });

  it("marks sections with rehearsal marks and repeats with barlines", () => {
    const xml = toMusicXml(structure, { title: "T" });
    expect(xml).toContain("<rehearsal>Chorus</rehearsal>");
    expect(xml).toContain('<repeat direction="forward"/>');
    expect(xml).toContain('<repeat direction="backward" times="2"/>');
    expect(xml).toContain(
      '<miscellaneous-field name="echo:section:5:kind">chorus</miscellaneous-field>',
    );
  });

  it("only writes <time> on the first measure and when it changes", () => {
    expect(toMusicXml(structure, { title: "T" }).match(/<time>/g)).toHaveLength(3);
  });

  it("writes forward durations that fill each bar exactly", () => {
    const time: TimeSignature = { beats: 5, beatType: 8 };
    const xml = toMusicXml(
      { sections: [{ ...structure.sections[0], time, bars: [{ chords: ["A", "B", "C"] }] }] },
      { title: "T" },
    );
    const durations = [...xml.matchAll(/<forward><duration>(\d+)<\/duration><\/forward>/g)].map(
      (m) => Number(m[1]),
    );
    expect(durations.reduce((a, b) => a + b, 0)).toBe(barDuration(time));
    expect(barDuration(time)).toBe(60);
  });

  it("keeps a slash chord distinct from a split bar", () => {
    expect(toMusicXml(structure, { title: "T" })).toContain(
      "<bass><bass-step>E</bass-step></bass>",
    );
  });

  it("reads a score without echo metadata as one 'other' section", () => {
    expect(fromMusicXml(MINIMAL_SCORE)).toEqual({
      sections: [
        {
          id: "section-1",
          kind: "other",
          name: "Section 1",
          repeat: 1,
          time: { beats: 4, beatType: 4 },
          bars: [{ chords: ["C"] }, { chords: ["G"] }],
          notes: "",
        },
      ],
    });
  });

  it("expands <measure-repeat> to the previous bar's chords", () => {
    const xml = score(
      `<measure number="1"><attributes><divisions>24</divisions></attributes>${harmony("C")}</measure>
       <measure number="2"><attributes><measure-style><measure-repeat type="start">1</measure-repeat></measure-style></attributes></measure>`,
    );
    expect(fromMusicXml(xml).sections[0].bars).toEqual([{ chords: ["C"] }, { chords: ["C"] }]);
  });

  it("throws on malformed XML", () => {
    expect(() => fromMusicXml("<score-partwise><part>")).toThrow();
  });
});
