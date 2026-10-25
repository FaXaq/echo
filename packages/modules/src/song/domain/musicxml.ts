import { XMLParser, XMLValidator } from "fast-xml-parser";
import { isChordSymbol, parseChordSymbol } from "./chord-symbol.js";
import {
  DEFAULT_TIME_SIGNATURE,
  formatTimeSignature,
  parseTimeSignature,
  sectionKindSchema,
  timeSignatureSchema,
  type Bar,
  type SongSection,
  type SongStructure,
  type TimeSignature,
} from "./structure.js";

export const MUSICXML_DIVISIONS = 24;

const KIND_BY_SUFFIX: Record<string, string> = {
  "": "major",
  m: "minor",
  "7": "dominant",
  maj7: "major-seventh",
  m7: "minor-seventh",
  dim: "diminished",
  dim7: "diminished-seventh",
  aug: "augmented",
  m7b5: "half-diminished",
  sus2: "suspended-second",
  sus4: "suspended-fourth",
  "6": "major-sixth",
  m6: "minor-sixth",
  "9": "dominant-ninth",
};

const SUFFIX_BY_KIND = Object.fromEntries(
  Object.entries(KIND_BY_SUFFIX).map(([suffix, kind]) => [kind, suffix]),
);

export function barDuration(time: TimeSignature) {
  return (time.beats * MUSICXML_DIVISIONS * 4) / time.beatType;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const sameTime = (a: TimeSignature, b: TimeSignature) =>
  a.beats === b.beats && a.beatType === b.beatType;

function writeHarmony(chord: string, duration: number) {
  const parsed = parseChordSymbol(chord);
  if (!parsed) throw new Error(`Invalid chord symbol: ${chord}`);
  const alter = (value: number) => (value === 0 ? "" : `<root-alter>${value}</root-alter>`);
  const kind = KIND_BY_SUFFIX[parsed.suffix] ?? "other";
  const bass = parsed.bass
    ? `<bass><bass-step>${parsed.bass.step}</bass-step>${
        parsed.bass.alter === 0 ? "" : `<bass-alter>${parsed.bass.alter}</bass-alter>`
      }</bass>`
    : "";
  return (
    `<harmony><root><root-step>${parsed.root}</root-step>${alter(parsed.alter)}</root>` +
    `<kind text="${escapeXml(parsed.suffix)}">${kind}</kind>${bass}</harmony>` +
    `<forward><duration>${duration}</duration></forward>`
  );
}

export function toMusicXml(structure: SongStructure, options: { title: string }) {
  const fields: string[] = [];
  const measures: string[] = [];
  let previous: TimeSignature | null = null;

  for (const section of structure.sections) {
    const first = measures.length + 1;
    fields.push(
      `<miscellaneous-field name="echo:section:${first}:kind">${section.kind}</miscellaneous-field>`,
    );
    fields.push(
      `<miscellaneous-field name="echo:section:${first}:time">${formatTimeSignature(section.time)}</miscellaneous-field>`,
    );
    if (section.notes !== "") {
      fields.push(
        `<miscellaneous-field name="echo:section:${first}:notes">${escapeXml(section.notes)}</miscellaneous-field>`,
      );
    }

    section.bars.forEach((bar, index) => {
      const time = bar.time ?? section.time;
      const total = barDuration(time);
      let body = "";
      if (index === 0 && section.repeat > 1) {
        body += '<barline location="left"><repeat direction="forward"/></barline>';
      }
      const attributes =
        (measures.length === 0 ? `<divisions>${MUSICXML_DIVISIONS}</divisions>` : "") +
        (!previous || !sameTime(previous, time)
          ? `<time><beats>${time.beats}</beats><beat-type>${time.beatType}</beat-type></time>`
          : "");
      if (attributes) body += `<attributes>${attributes}</attributes>`;
      if (index === 0) {
        body += `<direction placement="above"><direction-type><rehearsal>${escapeXml(section.name)}</rehearsal></direction-type></direction>`;
      }
      if (bar.chords.length === 0) {
        body += `<forward><duration>${total}</duration></forward>`;
      } else {
        const each = Math.floor(total / bar.chords.length);
        body += bar.chords
          .map((chord, i) =>
            writeHarmony(chord, i === bar.chords.length - 1 ? total - each * i : each),
          )
          .join("");
      }
      if (index === section.bars.length - 1 && section.repeat > 1) {
        body += `<barline location="right"><repeat direction="backward" times="${section.repeat}"/></barline>`;
      }
      measures.push(`<measure number="${measures.length + 1}">${body}</measure>`);
      previous = time;
    });
  }

  const identification = fields.length
    ? `<identification><miscellaneous>${fields.join("")}</miscellaneous></identification>`
    : "";

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n' +
    `<score-partwise version="4.0"><work><work-title>${escapeXml(options.title)}</work-title></work>` +
    identification +
    '<part-list><score-part id="P1"><part-name>Chords</part-name></score-part></part-list>' +
    `<part id="P1">${measures.join("")}</part></score-partwise>`
  );
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: false,
  parseTagValue: false,
  isArray: (name) =>
    ["part", "measure", "harmony", "barline", "direction", "miscellaneous-field"].includes(name),
});

function list(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  return isRecord(value) ? text(value["#text"]) : undefined;
}

function attr(value: unknown, name: string) {
  return isRecord(value) ? text(value[`@_${name}`]) : undefined;
}

function child(value: unknown, name: string): unknown {
  return isRecord(value) ? value[name] : undefined;
}

function parseTime(attributes: unknown): TimeSignature | null {
  for (const entry of list(attributes)) {
    const time = child(entry, "time");
    if (!time) continue;
    const parsed = timeSignatureSchema.safeParse({
      beats: Number(text(child(time, "beats"))),
      beatType: Number(text(child(time, "beat-type"))),
    });
    if (parsed.success) return parsed.data;
  }
  return null;
}

function parseAlter(value: unknown) {
  const alter = Number(text(value));
  if (alter === 1) return "#";
  if (alter === -1) return "b";
  return "";
}

function parseHarmony(harmony: unknown) {
  const root = child(harmony, "root");
  const step = text(child(root, "root-step"));
  if (!step) return null;
  const kind = child(harmony, "kind");
  const suffix = attr(kind, "text") ?? SUFFIX_BY_KIND[text(kind) ?? ""] ?? "";
  const bass = child(harmony, "bass");
  const bassStep = text(child(bass, "bass-step"));
  const chord =
    `${step}${parseAlter(child(root, "root-alter"))}${suffix}` +
    (bassStep ? `/${bassStep}${parseAlter(child(bass, "bass-alter"))}` : "");
  return isChordSymbol(chord) ? chord : null;
}

function repeatsPrevious(attributes: unknown) {
  return list(attributes).some((entry) =>
    list(child(child(entry, "measure-style"), "measure-repeat")).some(
      (repeat) => attr(repeat, "type") === "start",
    ),
  );
}

type ParsedMeasure = {
  rehearsal: string | undefined;
  time: TimeSignature;
  bar: Bar;
  backwardTimes: number | null;
};

function parseMeasures(measures: unknown[]) {
  const result: ParsedMeasure[] = [];
  let time = DEFAULT_TIME_SIGNATURE;
  for (const measure of measures) {
    const attributes = child(measure, "attributes");
    time = parseTime(attributes) ?? time;
    const rehearsal = list(child(measure, "direction"))
      .flatMap((direction) => list(child(direction, "direction-type")))
      .map((type) => text(child(type, "rehearsal")))
      .find((value) => value !== undefined);
    const chords = list(child(measure, "harmony")).flatMap((harmony) => {
      const chord = parseHarmony(harmony);
      return chord ? [chord] : [];
    });
    const previous = result.at(-1);
    const copied = chords.length === 0 && previous && repeatsPrevious(attributes);
    const backward = list(child(measure, "barline"))
      .map((barline) => child(barline, "repeat"))
      .find((repeat) => repeat && attr(repeat, "direction") === "backward");
    result.push({
      rehearsal,
      time,
      bar: { chords: copied ? previous.bar.chords : chords },
      backwardTimes: backward ? Number(attr(backward, "times") ?? 2) : null,
    });
  }
  return result;
}

function parseFields(root: unknown) {
  const fields = new Map<string, string>();
  const miscellaneous = child(child(root, "identification"), "miscellaneous");
  for (const field of list(child(miscellaneous, "miscellaneous-field"))) {
    const name = attr(field, "name");
    if (name) fields.set(name, text(field) ?? "");
  }
  return fields;
}

export function fromMusicXml(xml: string): SongStructure {
  const valid = XMLValidator.validate(xml);
  if (valid !== true) throw new Error(`Malformed MusicXML: ${valid.err.msg}`);
  const root = parser.parse(xml)["score-partwise"];
  if (!root) throw new Error("Not a MusicXML partwise score");

  const fields = parseFields(root);
  const measures = parseMeasures(list(child(list(child(root, "part"))[0], "measure")));
  const starts = measures.flatMap((measure, index) =>
    index === 0 || measure.rehearsal !== undefined ? [index] : [],
  );

  const sections = starts.map((start, index): SongSection => {
    const end = starts[index + 1] ?? measures.length;
    const slice = measures.slice(start, end);
    const time =
      parseTimeSignature(fields.get(`echo:section:${start + 1}:time`) ?? "") ?? slice[0].time;
    const backward = slice.at(-1)?.backwardTimes ?? 1;
    const kind = sectionKindSchema.safeParse(fields.get(`echo:section:${start + 1}:kind`));
    return {
      id: `section-${index + 1}`,
      kind: kind.success ? kind.data : "other",
      name: slice[0].rehearsal || `Section ${index + 1}`,
      repeat: backward,
      time,
      bars: slice.map(({ bar, time: barTime }) =>
        sameTime(barTime, time) ? bar : { ...bar, time: barTime },
      ),
      notes: fields.get(`echo:section:${start + 1}:notes`) ?? "",
    };
  });
  return { sections };
}
