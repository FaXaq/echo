import { useState } from "react";
import { ListMusic, Plus } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import {
  sectionKindSchema,
  type SectionKind,
  type SongSection,
  type SongStructure,
  type TimeSignature,
} from "@echo/modules/song/domain";

import { Button } from "@/components/ui/button";
import { ListEmptyState } from "@/components/ui/list-empty-state";
import { SectionPanel } from "./section-panel";
import { SECTION_KIND_LABELS } from "./section-kind";
import { StructureTimeline } from "./structure-timeline";

const NEW_SECTION_BARS = 4;

export function SongStructureEditor({
  structure,
  defaultTime,
  onChange,
}: {
  structure: SongStructure;
  defaultTime: TimeSignature;
  onChange: (structure: SongStructure) => void;
}) {
  const { t } = useLingui();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const { sections } = structure;
  const selected = sections.find((section) => section.id === selectedId) ?? sections[0];

  function setSections(next: SongSection[]) {
    onChange({ ...structure, sections: next });
  }

  function insert(kind: SectionKind, index: number) {
    const section: SongSection = {
      id: crypto.randomUUID(),
      kind,
      name: t(SECTION_KIND_LABELS[kind]),
      repeat: 1,
      time: defaultTime,
      bars: Array.from({ length: NEW_SECTION_BARS }, () => ({ chords: [] })),
      notes: "",
    };
    setSections([...sections.slice(0, index), section, ...sections.slice(index)]);
    setSelectedId(section.id);
    setInsertAt(null);
  }

  function move(id: string, toIndex: number) {
    const from = sections.findIndex((section) => section.id === id);
    if (from < 0) return;
    const rest = sections.filter((section) => section.id !== id);
    rest.splice(toIndex, 0, sections[from]);
    setSections(rest);
  }

  const addButton = (
    <Button type="button" variant="outline" size="sm" onClick={() => setInsertAt(sections.length)}>
      <Plus />
      <Trans>Add section</Trans>
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">
          <Trans>Structure</Trans>
        </h2>
        {addButton}
      </div>

      {sections.length === 0 ? (
        <ListEmptyState
          icon={<ListMusic />}
          title={<Trans>No sections yet</Trans>}
          description={<Trans>Build the song from intros, verses and choruses.</Trans>}
          action={addButton}
        />
      ) : (
        <StructureTimeline
          sections={sections}
          selectedId={selected.id}
          onSelect={setSelectedId}
          onMove={move}
          onInsertAt={setInsertAt}
        />
      )}

      {insertAt !== null && (
        <div
          role="group"
          aria-label={t`Choose a section type`}
          className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2.5"
        >
          {sectionKindSchema.options.map((kind) => (
            <Button
              key={kind}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insert(kind, insertAt)}
            >
              {t(SECTION_KIND_LABELS[kind])}
            </Button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setInsertAt(null)}>
            <Trans>Cancel</Trans>
          </Button>
        </div>
      )}

      {selected && (
        <SectionPanel
          section={selected}
          onChange={(section) =>
            setSections(sections.map((item) => (item.id === section.id ? section : item)))
          }
          onDelete={() => setSections(sections.filter((item) => item.id !== selected.id))}
        />
      )}
    </div>
  );
}
