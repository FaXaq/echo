export type NoteStep = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type Alter = -1 | 0 | 1;
export type ChordSymbol = {
  root: NoteStep;
  alter: Alter;
  suffix: string;
  bass: { step: NoteStep; alter: Alter } | null;
};

const CHORD_PATTERN = /^([A-G])([#b]?)([^/\s]*)(?:\/([A-G])([#b]?))?$/;

const noteSteps: readonly NoteStep[] = ["A", "B", "C", "D", "E", "F", "G"];

function toStep(value: string) {
  return noteSteps.find((step) => step === value);
}

function toAlter(value: string): Alter {
  if (value === "#") return 1;
  if (value === "b") return -1;
  return 0;
}

function accidental(alter: Alter) {
  if (alter === 1) return "#";
  if (alter === -1) return "b";
  return "";
}

export function parseChordSymbol(value: string): ChordSymbol | null {
  const match = CHORD_PATTERN.exec(value);
  if (!match) return null;
  const [, root, rootAlter, suffix, bassStep, bassAlter] = match;
  const rootStep = toStep(root);
  if (!rootStep) return null;
  const bass = bassStep ? toStep(bassStep) : undefined;
  return {
    root: rootStep,
    alter: toAlter(rootAlter),
    suffix,
    bass: bass ? { step: bass, alter: toAlter(bassAlter ?? "") } : null,
  };
}

export function formatChordSymbol(chord: ChordSymbol): string {
  const bass = chord.bass ? `/${chord.bass.step}${accidental(chord.bass.alter)}` : "";
  return `${chord.root}${accidental(chord.alter)}${chord.suffix}${bass}`;
}

export function isChordSymbol(value: string): boolean {
  return parseChordSymbol(value) !== null;
}
