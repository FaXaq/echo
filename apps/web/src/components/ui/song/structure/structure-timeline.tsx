import type { DragEvent } from "react";
import { useLingui } from "@lingui/react/macro";
import type { SongSection } from "@echo/modules/song/domain";

import { SECTION_KIND_COLORS, sectionTint } from "./section-kind";

export const SECTION_DRAG_TYPE = "application/x-echo-section";

function acceptSection(event: DragEvent) {
  if (event.dataTransfer.types.includes(SECTION_DRAG_TYPE)) event.preventDefault();
}

function InsertSlot({
  label,
  onInsert,
  onDropSection,
}: {
  label: string;
  onInsert: () => void;
  onDropSection?: (id: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onInsert}
      onDragOver={onDropSection && acceptSection}
      onDrop={
        onDropSection &&
        ((event) => {
          event.preventDefault();
          onDropSection(event.dataTransfer.getData(SECTION_DRAG_TYPE));
        })
      }
      className="flex w-2 flex-none items-center justify-center overflow-hidden rounded-md text-base font-semibold text-muted-foreground opacity-0 transition-[width,opacity] outline-none hover:w-7 hover:bg-accent hover:opacity-100 focus-visible:w-7 focus-visible:bg-accent focus-visible:opacity-100"
    >
      +
    </button>
  );
}

export function StructureTimeline({
  sections,
  selectedId,
  onSelect,
  onMove,
  onInsertAt,
}: {
  sections: SongSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, toIndex: number) => void;
  onInsertAt: (index: number) => void;
}) {
  const { t } = useLingui();

  return (
    <div className="flex h-16 items-stretch">
      {sections.map((section, index) => {
        const selected = section.id === selectedId;
        const name = section.name;
        return (
          <div
            key={section.id}
            className="flex min-w-0 items-stretch"
            style={{ flex: `${section.bars.length * section.repeat} 1 0` }}
          >
            <InsertSlot
              label={t`Insert a section before ${name}`}
              onInsert={() => onInsertAt(index)}
            />
            <button
              type="button"
              draggable
              aria-pressed={selected}
              onClick={() => onSelect(section.id)}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData(SECTION_DRAG_TYPE, section.id);
              }}
              onDragOver={acceptSection}
              onDrop={(event) => {
                event.preventDefault();
                onMove(event.dataTransfer.getData(SECTION_DRAG_TYPE), index);
              }}
              className="flex min-w-0 flex-1 cursor-grab flex-col items-start justify-center gap-0.5 rounded-md px-2.5 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              style={{
                background: sectionTint(section.kind, selected ? 38 : 18),
                boxShadow: selected
                  ? `inset 0 0 0 2px ${SECTION_KIND_COLORS[section.kind]}`
                  : undefined,
              }}
            >
              <span className="w-full truncate text-[13px] font-semibold">{section.name}</span>
              <span className="text-[11px] opacity-75 tabular-nums">
                {section.repeat > 1 ? `×${section.repeat}` : section.bars.length}
              </span>
            </button>
          </div>
        );
      })}
      <InsertSlot
        label={t`Insert a section at the end`}
        onInsert={() => onInsertAt(sections.length)}
        onDropSection={(id) => onMove(id, sections.length)}
      />
    </div>
  );
}
