import { isChordSymbol } from "./chord-symbol.js";
import { formatTimeSignature, parseTimeSignature, type Bar } from "./structure.js";

const BARS_PER_LINE = 4;
const TIME_PREFIX = /^\((\d+\/\d+)\)\s*/;

export function barLabel(bars: Bar[], index: number): string {
  const bar = bars[index];
  const previous = bars[index - 1];
  if (bar.chords.length === 0) return "N.C.";
  if (
    previous &&
    !bar.time &&
    bar.chords.length === previous.chords.length &&
    bar.chords.every((chord, i) => chord === previous.chords[i])
  ) {
    return "%";
  }
  return bar.chords.join(" / ");
}

export function barsToText(bars: Bar[]): string {
  const cells = bars.map((bar, i) => {
    const prefix = bar.time ? `(${formatTimeSignature(bar.time)}) ` : "";
    return `${prefix}${barLabel(bars, i)}`;
  });
  const lines: string[] = [];
  for (let i = 0; i < cells.length; i += BARS_PER_LINE) {
    lines.push(`| ${cells.slice(i, i + BARS_PER_LINE).join(" | ")} |`);
  }
  return lines.join("\n");
}

export type ChordTextResult = { ok: true; bars: Bar[] } | { ok: false; bar: number; token: string };

export function textToBars(text: string): ChordTextResult {
  const segments = text
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const bars: Bar[] = [];

  for (const [index, segment] of segments.entries()) {
    const fail = (token: string): ChordTextResult => ({ ok: false, bar: index + 1, token });
    let body = segment;
    let time: Bar["time"];

    const prefix = TIME_PREFIX.exec(body);
    if (prefix) {
      time = parseTimeSignature(prefix[1]) ?? undefined;
      if (!time) return fail(prefix[1]);
      body = body.slice(prefix[0].length);
    }

    let chords: string[];
    if (body === "%") {
      const previous = bars[bars.length - 1];
      if (!previous) return fail("%");
      chords = [...previous.chords];
    } else if (body === "N.C.") {
      chords = [];
    } else {
      chords = body.split(/\s+/).filter((token) => token !== "/");
      const invalid = chords.find((token) => !isChordSymbol(token));
      if (invalid !== undefined) return fail(invalid);
    }

    bars.push(time ? { chords, time } : { chords });
  }

  return { ok: true, bars };
}
