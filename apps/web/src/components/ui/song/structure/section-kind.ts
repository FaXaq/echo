import { msg } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";
import type { SectionKind } from "@echo/modules/song/domain";

export const SECTION_KIND_LABELS: Record<SectionKind, MessageDescriptor> = {
  intro: msg`Intro`,
  verse: msg`Verse`,
  chorus: msg`Chorus`,
  bridge: msg`Bridge`,
  solo: msg`Solo`,
  outro: msg`Outro`,
  other: msg`Other`,
};

export const SECTION_KIND_COLORS: Record<SectionKind, string> = {
  intro: "var(--muted-foreground)",
  verse: "var(--event-blue)",
  chorus: "var(--event-orange)",
  bridge: "var(--event-purple)",
  solo: "var(--event-green)",
  outro: "var(--muted-foreground)",
  other: "var(--muted-foreground)",
};

export function sectionTint(kind: SectionKind, percent: number) {
  return `color-mix(in oklch, ${SECTION_KIND_COLORS[kind]} ${percent}%, var(--background))`;
}
