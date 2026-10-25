import { z } from "zod";
import { isChordSymbol } from "./chord-symbol.js";

export const sectionKindSchema = z.enum([
  "intro",
  "verse",
  "chorus",
  "bridge",
  "solo",
  "outro",
  "other",
]);
export type SectionKind = z.infer<typeof sectionKindSchema>;

export const timeSignatureSchema = z.object({
  beats: z.number().int().min(1).max(32),
  beatType: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(4),
    z.literal(8),
    z.literal(16),
    z.literal(32),
  ]),
});
export type TimeSignature = z.infer<typeof timeSignatureSchema>;

export const DEFAULT_TIME_SIGNATURE: TimeSignature = { beats: 4, beatType: 4 };

export const TIME_SIGNATURE_PATTERN = /^([1-9]|[12]\d|3[0-2])\/(1|2|4|8|16|32)$/;

export const barSchema = z.object({
  chords: z.array(z.string().refine(isChordSymbol, { message: "Invalid chord symbol" })).max(8),
  time: timeSignatureSchema.optional(),
});
export type Bar = z.infer<typeof barSchema>;

export const songSectionSchema = z.object({
  id: z.string().min(1),
  kind: sectionKindSchema,
  name: z.string().min(1).max(100),
  repeat: z.number().int().min(1).max(16),
  time: timeSignatureSchema.nullable(),
  bars: z.array(barSchema).min(1).max(256),
  notes: z.string().max(2000),
});
export type SongSection = z.infer<typeof songSectionSchema>;

export const songStructureSchema = z.object({
  sections: z.array(songSectionSchema).max(100),
});
export type SongStructure = z.infer<typeof songStructureSchema>;

export function formatTimeSignature(time: TimeSignature): string {
  return `${time.beats}/${time.beatType}`;
}

export function parseTimeSignature(value: string): TimeSignature | null {
  const match = TIME_SIGNATURE_PATTERN.exec(value);
  if (!match) return null;
  const parsed = timeSignatureSchema.safeParse({
    beats: Number(match[1]),
    beatType: Number(match[2]),
  });
  return parsed.success ? parsed.data : null;
}
